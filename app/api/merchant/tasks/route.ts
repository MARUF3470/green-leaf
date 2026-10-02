import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

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

    const tasks = await db.orm.public.Task
      .where({ businessId })
      .all();

    if (tasks.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const taskIds = new Set(tasks.map((task) => task.id));

    // TaskAssignment and TaskFinance do not have businessId,
    // so filter them through this business's task IDs.
    const [allAssignments, allFinances, employees] = await Promise.all([
      db.orm.public.TaskAssignment.where({}).all(),
      db.orm.public.TaskFinance.where({}).all(),
      db.orm.public.User.where({ businessId, role: "EMPLOYEE" }).all(),
    ]);

    const employeeIds = new Set(employees.map((employee) => employee.id));

    const assignments = allAssignments.filter(
      (assignment) =>
        taskIds.has(assignment.taskId) &&
        employeeIds.has(assignment.employeeId) &&
        String(assignment.status).toUpperCase() !== "CANCELLED",
    );

    const finances = allFinances.filter((finance) =>
      taskIds.has(finance.taskId),
    );

    const employeeById = new Map(
      employees.map((employee) => [employee.id, employee]),
    );

    const financeByTaskId = new Map(
      finances.map((finance) => [finance.taskId, finance]),
    );

    const assignmentsByTaskId = new Map<
      string,
      typeof assignments
    >();

    for (const assignment of assignments) {
      const existing = assignmentsByTaskId.get(assignment.taskId) ?? [];
      existing.push(assignment);
      assignmentsByTaskId.set(assignment.taskId, existing);
    }

    const result = tasks
      .map((task) => {
        const taskAssignments =
          assignmentsByTaskId.get(task.id) ?? [];

        const employeeNames = taskAssignments.map((assignment) => {
          const employee = employeeById.get(assignment.employeeId);
          return employee?.email ?? "Assigned employee";
        });

        const taskStatus = String(task.status).toUpperCase();

        // The task's operational status takes precedence.
        // For tasks not yet started, use the assignment status.
        let status: string;

        if (taskStatus === "IN_PROGRESS") {
          status = "In Progress";
        } else if (taskStatus === "COMPLETED") {
          status = "Completed";
        } else if (taskStatus === "CANCELLED") {
          status = "Cancelled";
        } else if (
          taskAssignments.some(
            (assignment) =>
              String(assignment.status).toUpperCase() === "ACCEPTED",
          )
        ) {
          status = "Accepted";
        } else {
          status = "Pending";
        }

        const finance = financeByTaskId.get(task.id);

        return {
          id: task.id,
          task: task.name,
          address: task.locationAddress ?? "",
          employee: employeeNames.length
            ? employeeNames.join(", ")
            : "Unassigned",
          durationMinutes: Number(task.durationMinutes ?? 0),
          status,
          price: Number(finance?.price ?? 0),
          scheduledStart: task.scheduledStart
            ? String(task.scheduledStart)
            : null,
          createdAt: task.createdAt
            ? String(task.createdAt)
            : null,
        };
      })
      .sort((a, b) => {
        const dateA = a.scheduledStart
          ? new Date(a.scheduledStart).getTime()
          : 0;
        const dateB = b.scheduledStart
          ? new Date(b.scheduledStart).getTime()
          : 0;

        return dateB - dateA;
      });

    return NextResponse.json({ tasks: result });
  } catch (error) {
    console.error("Merchant tasks API error:", error);

    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
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

    const body = await request.json();
    const taskId = body?.taskId;

    if (typeof taskId !== "string" || !taskId.trim()) {
      return NextResponse.json(
        { message: "A valid task ID is required" },
        { status: 400 },
      );
    }

    // Verify the task belongs to this business.
    const task = await db.orm.public.Task
      .where({ id: taskId, businessId })
      .first();

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 },
      );
    }

    // Find assignments for this task.
    const assignments = await db.orm.public.TaskAssignment
      .where({ taskId })
      .all();

    const assignmentIds = new Set(
      assignments.map((assignment) => assignment.id),
    );

    // Payment records must be preserved.
    const allPayments = await db.orm.public.Payment
      .where({ businessId })
      .all();

    const hasPayment = allPayments.some((payment) =>
      assignmentIds.has(payment.assignmentId),
    );

    if (hasPayment) {
      return NextResponse.json(
        {
          message:
            "This task cannot be deleted because it has recorded payments. Keep it for financial history.",
        },
        { status: 409 },
      );
    }

    // Delete the task. Its related finance, assignments, and instruments
    // are configured to cascade in the database schema.
    await db.orm.public.Task
      .where({ id: taskId, businessId })
      .delete();

    return NextResponse.json({
      message: "Task deleted successfully",
      taskId,
    });
  } catch (error) {
    console.error("Delete merchant task error:", error);

    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 },
    );
  }
}