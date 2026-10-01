import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// Adjust to your authOptions path
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;

function toDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    // Supports JavaScript Date and Temporal.Instant-like values.
    const date =
      value instanceof Date
        ? value
        : new Date(
            typeof value === "object" &&
              value !== null &&
              "epochMilliseconds" in value
              ? Number(
                  (value as { epochMilliseconds: number }).epochMilliseconds,
                )
              : String(value),
          );

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function startOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

function inRange(date: Date | null, start: Date, end: Date) {
  return !!date && date >= start && date < end;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-AU", {
    month: "short",
    timeZone: "UTC",
  });
}

function isMaterialExpense(label: string) {
  return /material|supply|supplies|chemical|detergent|consumable/i.test(label);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER" || !session.user.businessId) {
      return NextResponse.json(
        { error: "Only business owners can view analytics." },
        { status: 403 },
      );
    }

    const businessId = session.user.businessId;

    // Fetch only this business's tasks and business-owned records.
    const [tasks, expenses, instruments] = await Promise.all([
      db.orm.public.Task.where({ businessId }).all(),
      db.orm.public.Expense.where({ businessId }).all(),
      db.orm.public.Instrument.where({ businessId }).all(),
    ]);

    const taskIds = new Set(tasks.map((task: AnyRecord) => task.id));

    // These tables are related to tasks but do not have businessId.
    const [allFinance, allAssignments] = await Promise.all([
      db.orm.public.TaskFinance.where({}).all(),
      db.orm.public.TaskAssignment.where({}).all(),
    ]);

    const finance = allFinance.filter((item: AnyRecord) =>
      taskIds.has(item.taskId),
    );

    const assignments = allAssignments.filter((item: AnyRecord) =>
      taskIds.has(item.taskId),
    );

    const taskById = new Map<string, AnyRecord>(
      tasks.map((task: AnyRecord) => [task.id, task]),
    );

    const financeByTask = new Map<string, AnyRecord>(
      finance.map((item: AnyRecord) => [item.taskId, item]),
    );

    const assignmentsByTask = new Map<string, AnyRecord[]>();

    for (const assignment of assignments as AnyRecord[]) {
      const list = assignmentsByTask.get(assignment.taskId) ?? [];
      list.push(assignment);
      assignmentsByTask.set(assignment.taskId, list);
    }

    const instrumentsByTask = new Map<string, AnyRecord[]>();

    for (const instrument of instruments as AnyRecord[]) {
      const list = instrumentsByTask.get(instrument.taskId) ?? [];
      list.push(instrument);
      instrumentsByTask.set(instrument.taskId, list);
    }

    const expensesByTask = new Map<string, AnyRecord[]>();

    for (const expense of expenses as AnyRecord[]) {
      if (!expense.taskId) continue;

      const list = expensesByTask.get(expense.taskId) ?? [];
      list.push(expense);
      expensesByTask.set(expense.taskId, list);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const nextMonthStart = addMonths(thisMonthStart, 1);

    // Monday-starting week, using UTC date boundaries.
    const today = startOfDay(now);
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const weekStart = addDays(today, -mondayOffset);
    const nextWeekStart = addDays(weekStart, 7);

    const getTaskDate = (task: AnyRecord) =>
      toDate(task.updatedAt) ??
      toDate(task.createdAt) ??
      toDate(task.scheduledStart);

    const getTaskRevenue = (task: AnyRecord) =>
      Number(financeByTask.get(task.id)?.price ?? 0);

    const getTaskLabor = (task: AnyRecord) =>
      (assignmentsByTask.get(task.id) ?? []).reduce(
        (sum, item) => sum + Number(item.payoutAmount ?? 0),
        0,
      );

    const getTaskEquipment = (task: AnyRecord) =>
      (instrumentsByTask.get(task.id) ?? []).reduce(
        (sum, item) =>
          sum + Number(item.price ?? 0) * Number(item.quantity ?? 1),
        0,
      );

    const getTaskExpenses = (task: AnyRecord) =>
      (expensesByTask.get(task.id) ?? []).reduce(
        (sum, item) => sum + Number(item.amount ?? 0),
        0,
      );

    const getTaskCosts = (task: AnyRecord) =>
      getTaskLabor(task) + getTaskEquipment(task) + getTaskExpenses(task);

    // Treat completed tasks as earned revenue.
    const completedThisMonth = tasks.filter((task: AnyRecord) => {
      const date = getTaskDate(task);

      return (
        task.status === "COMPLETED" &&
        inRange(date, thisMonthStart, nextMonthStart)
      );
    });

    const totalRevenue = completedThisMonth.reduce(
      (sum: number, task: AnyRecord) => sum + getTaskRevenue(task),
      0,
    );

    const completedTaskIds = new Set(
      completedThisMonth.map((task: AnyRecord) => task.id),
    );

    const completedMonthAssignments = assignments.filter((item: AnyRecord) =>
      completedTaskIds.has(item.taskId),
    );

    const completedMonthInstruments = instruments.filter((item: AnyRecord) =>
      completedTaskIds.has(item.taskId),
    );

    const completedMonthExpenses = expenses.filter((item: AnyRecord) => {
      if (item.taskId) return completedTaskIds.has(item.taskId);

      return inRange(
        toDate(item.incurredAt) ?? toDate(item.createdAt),
        thisMonthStart,
        nextMonthStart,
      );
    });

    const laborCost = completedMonthAssignments.reduce(
      (sum: number, item: AnyRecord) => sum + Number(item.payoutAmount ?? 0),
      0,
    );

    const equipmentCost = completedMonthInstruments.reduce(
      (sum: number, item: AnyRecord) =>
        sum + Number(item.price ?? 0) * Number(item.quantity ?? 1),
      0,
    );

    const materialCost = completedMonthExpenses.reduce(
      (sum: number, item: AnyRecord) =>
        sum +
        (isMaterialExpense(String(item.label ?? ""))
          ? Number(item.amount ?? 0)
          : 0),
      0,
    );

    const otherCost = completedMonthExpenses.reduce(
      (sum: number, item: AnyRecord) =>
        sum +
        (!isMaterialExpense(String(item.label ?? ""))
          ? Number(item.amount ?? 0)
          : 0),
      0,
    );

    const totalCosts = laborCost + equipmentCost + materialCost + otherCost;

    // Weekly earnings and costs, grouped by day.
    const weeklyData = Array.from({ length: 7 }, (_, index) => {
      const dayStart = addDays(weekStart, index);
      const dayEnd = addDays(dayStart, 1);

      const dayTasks = tasks.filter((task: AnyRecord) => {
        const date = getTaskDate(task);

        return task.status === "COMPLETED" && inRange(date, dayStart, dayEnd);
      });

      const dayTaskIds = new Set(dayTasks.map((task: AnyRecord) => task.id));

      const dayGeneralExpenses = expenses.filter((item: AnyRecord) => {
        if (item.taskId) return false;

        return inRange(
          toDate(item.incurredAt) ?? toDate(item.createdAt),
          dayStart,
          dayEnd,
        );
      });

      const dayCosts =
        dayTasks.reduce(
          (sum: number, task: AnyRecord) => sum + getTaskCosts(task),
          0,
        ) +
        dayGeneralExpenses.reduce(
          (sum: number, item: AnyRecord) => sum + Number(item.amount ?? 0),
          0,
        );

      return {
        day: dayStart.toLocaleDateString("en-AU", {
          weekday: "short",
          timeZone: "UTC",
        }),
        costs: money(dayCosts),
        earnings: money(
          dayTasks.reduce(
            (sum: number, task: AnyRecord) => sum + getTaskRevenue(task),
            0,
          ),
        ),
        taskIds: [...dayTaskIds],
      };
    }).map(({ taskIds: _taskIds, ...item }) => item);

    // Last six calendar months, including the current month.
    const firstTrendMonth = addMonths(thisMonthStart, -5);

    const profitTrend = Array.from({ length: 6 }, (_, index) => {
      const monthStart = addMonths(firstTrendMonth, index);
      const monthEnd = addMonths(monthStart, 1);

      const monthTasks = tasks.filter((task: AnyRecord) => {
        const date = getTaskDate(task);

        return (
          task.status === "COMPLETED" && inRange(date, monthStart, monthEnd)
        );
      });

      const monthRevenue = monthTasks.reduce(
        (sum: number, task: AnyRecord) => sum + getTaskRevenue(task),
        0,
      );

      const monthTaskIds = new Set(
        monthTasks.map((task: AnyRecord) => task.id),
      );

      const monthTaskExpenses = expenses
        .filter(
          (item: AnyRecord) => item.taskId && monthTaskIds.has(item.taskId),
        )
        .reduce(
          (sum: number, item: AnyRecord) => sum + Number(item.amount ?? 0),
          0,
        );

      const monthGeneralExpenses = expenses
        .filter((item: AnyRecord) => {
          if (item.taskId) return false;

          return inRange(
            toDate(item.incurredAt) ?? toDate(item.createdAt),
            monthStart,
            monthEnd,
          );
        })
        .reduce(
          (sum: number, item: AnyRecord) => sum + Number(item.amount ?? 0),
          0,
        );

      const monthTaskCosts = monthTasks.reduce(
        (sum: number, task: AnyRecord) => sum + getTaskCosts(task),
        0,
      );

      return {
        month: monthLabel(monthStart),
        profit: money(monthRevenue - monthTaskCosts - monthGeneralExpenses),
      };
    });

    const tasksDone = completedThisMonth.length;

    const costBreakdown = [
      { name: "Labor", value: laborCost },
      { name: "Equipment", value: equipmentCost },
      { name: "Materials", value: materialCost },
      { name: "Other", value: otherCost },
    ];

    const costTotal = costBreakdown.reduce((sum, item) => sum + item.value, 0);

    const formattedCostBreakdown = costBreakdown.map((item) => ({
      ...item,
      value: costTotal > 0 ? Math.round((item.value / costTotal) * 100) : 0,
    }));

    const netProfit = totalRevenue - totalCosts;

    return NextResponse.json({
      stats: {
        totalRevenue: money(totalRevenue),
        totalCosts: money(totalCosts),
        netProfit: money(netProfit),
        profitMargin:
          totalRevenue > 0
            ? Number(((netProfit / totalRevenue) * 100).toFixed(1))
            : 0,
        tasksDone,
      },
      weeklyData,
      costBreakdown: formattedCostBreakdown,
      profitTrend,
      period: {
        month: thisMonthStart.toISOString(),
        weekStart: weekStart.toISOString(),
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      { error: "Failed to load analytics." },
      { status: 500 },
    );
  }
}
