import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

function toDate(value: unknown): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDate(value: unknown): string | null {
  const date = toDate(value);
  return date ? date.toISOString() : null;
}

function getWeekStart() {
  // Monday at midnight, using the server's local timezone.
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

function formatRelativeTime(value: unknown) {
  const date = toDate(value);
  if (!date) return "Recently";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { message: "No business is associated with this account" },
        { status: 403 },
      );
    }

    // Fetch business-owned records.
    const [tasks, employees, instruments] = await Promise.all([
      db.orm.public.Task.where({ businessId }).all(),
      db.orm.public.User.where({ businessId, role: "EMPLOYEE" }).all(),
      db.orm.public.Instrument.where({ businessId }).all(),
    ]);

    const taskIds = new Set(tasks.map((task) => task.id));
    const employeeIds = new Set(employees.map((employee) => employee.id));

    // These models do not have businessId directly, so scope them
    // through the business's task IDs / employee IDs.
    const [allAssignments, allFinances] = await Promise.all([
      db.orm.public.TaskAssignment.where({}).all(),
      db.orm.public.TaskFinance.where({}).all(),
    ]);

    const assignments = allAssignments.filter(
      (assignment) =>
        taskIds.has(assignment.taskId) &&
        employeeIds.has(assignment.employeeId),
    );

    const finances = allFinances.filter((finance) =>
      taskIds.has(finance.taskId),
    );

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const employeeById = new Map(
      employees.map((employee) => [employee.id, employee]),
    );
    const financeByTaskId = new Map(
      finances.map((finance) => [finance.taskId, finance]),
    );

    // Active tasks: open or currently in progress.
    const activeTasks = tasks.filter((task) =>
      ["OPEN", "IN_PROGRESS"].includes(String(task.status).toUpperCase()),
    );

    // Availability profiles are looked up only for employees in this business.
    const employeeProfiles = await Promise.all(
      employees.map((employee) =>
        db.orm.public.EmployeeProfile
          .where({ userId: employee.id })
          .first(),
      ),
    );

    const availableStaff = employeeProfiles.filter(
      (profile) => profile?.isAvailable ?? true,
    ).length;

    // Count instruments that are waiting for approval.
    const pendingInstruments = instruments.filter(
      (instrument) =>
        String(instrument.approval ?? "").toUpperCase() === "PENDING",
    );

    // Weekly earnings: completed task revenue whose updatedAt falls
    // within the current week. See note below about completion timestamps.
    const weekStart = getWeekStart();
    const now = new Date();

    const completedThisWeek = tasks.filter((task) => {
      if (String(task.status).toUpperCase() !== "COMPLETED") {
        return false;
      }

      const updatedAt = toDate(task.updatedAt);

      return (
        updatedAt !== null &&
        updatedAt >= weekStart &&
        updatedAt <= now
      );
    });

    const weekEarnings = completedThisWeek.reduce((total, task) => {
      const finance = financeByTaskId.get(task.id);
      return total + Number(finance?.price ?? 0);
    }, 0);

    // Build recent task list, using assignment records for employee names.
    const recentTasks = [...tasks]
      .sort((a, b) => {
        const dateA = toDate(a.updatedAt)?.getTime() ?? 0;
        const dateB = toDate(b.updatedAt)?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((task) => {
        const taskAssignments = assignments.filter(
          (assignment) => assignment.taskId === task.id,
        );

        const assignedNames = taskAssignments
          .map((assignment) => {
            const employee = employeeById.get(assignment.employeeId);
          return employee?.email ?? "Assigned employee";
          })
          .filter(Boolean);

        const finance = financeByTaskId.get(task.id);

        return {
          id: task.id,
          name: task.name,
          person: assignedNames.length
            ? assignedNames.join(", ")
            : "Unassigned",
          durationMinutes: Number(task.durationMinutes ?? 0),
          status: String(task.status),
          amount: Number(finance?.price ?? 0),
          updatedAt: serializeDate(task.updatedAt),
        };
      });

    // Derive activity items from the latest records.
    const activityItems: {
      id: string;
      text: string;
      date: string | null;
      active: boolean;
    }[] = [];

    for (const assignment of assignments) {
      const task = taskById.get(assignment.taskId);
      const employee = employeeById.get(assignment.employeeId);

      if (!task) continue;

      const employeeName = employee?.email ?? "An employee";

      const status = String(assignment.status).toUpperCase();
      const date =
        assignment.completedAt ??
        assignment.updatedAt ??
        assignment.createdAt;

      if (status === "ACCEPTED") {
        activityItems.push({
          id: `assignment-${assignment.id}`,
          text: `${employeeName} accepted task: ${task.name}`,
          date: serializeDate(date),
          active: true,
        });
      } else if (status === "COMPLETED") {
        activityItems.push({
          id: `assignment-${assignment.id}`,
          text: `${employeeName} completed task: ${task.name}`,
          date: serializeDate(date),
          active: false,
        });
      } else if (status === "REJECTED") {
        activityItems.push({
          id: `assignment-${assignment.id}`,
          text: `${employeeName} rejected task: ${task.name}`,
          date: serializeDate(date),
          active: false,
        });
      }
    }

    for (const instrument of pendingInstruments) {
      const task = instrument.taskId
        ? taskById.get(instrument.taskId)
        : null;

      const date = instrument.createdAt;

      activityItems.push({
        id: `instrument-${instrument.id}`,
        text: `${instrument.name} requires approval${
          task ? ` for ${task.name}` : ""
        }`,
        date: serializeDate(date),
        active: true,
      });
    }

    for (const profile of employeeProfiles) {
      if (!profile?.availabilityUpdatedAt) continue;

      const employee = employees.find(
        (item) => item.id === profile.userId,
      );

      if (!employee) continue;

      activityItems.push({
        id: `availability-${profile.userId}`,
       text: `${employee.email ?? "An employee"} changed availability to ${
  profile.isAvailable ? "Available" : "Unavailable"
}`,
        date: serializeDate(profile.availabilityUpdatedAt),
        active: false,
      });
    }

    const activities = activityItems
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6)
      .map((activity) => ({
        ...activity,
        time: formatRelativeTime(activity.date),
      }));

    return NextResponse.json({
      stats: {
        activeTasks: activeTasks.length,
        availableStaff,
        totalStaff: employees.length,
        weekEarnings,
        pendingApprovals: pendingInstruments.length,
        pendingInstrumentRequests: pendingInstruments.length,
      },
      tasks: recentTasks,
      activities,
    });
  } catch (error) {
    console.error("Merchant dashboard API error:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}