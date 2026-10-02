import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "OWNER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 400 },
      );
    }

    const employees = await db.orm.public.User.where({
      businessId,
      role: "EMPLOYEE",
    }).all();

    const profiles = await db.orm.public.EmployeeProfile.where(
      {},
    ).all();

    const assignments = await db.orm.public.TaskAssignment.where(
      {},
    ).all();

    const tasks = await db.orm.public.Task.where({
      businessId,
    }).all();

    const taskIds = new Set(tasks.map((task) => task.id));
    const employeeIds = new Set(
      employees.map((employee) => employee.id),
    );

    const businessAssignments = assignments.filter(
      (assignment) =>
        taskIds.has(assignment.taskId) &&
        employeeIds.has(assignment.employeeId),
    );

    const taskMap = new Map(
      tasks.map((task) => [task.id, task]),
    );

    const profileMap = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    );

    const employeeData = employees.map((employee) => {
      const profile = profileMap.get(employee.id);

      const employeeAssignments = businessAssignments.filter(
        (assignment) =>
          assignment.employeeId === employee.id,
      );

      const completed = employeeAssignments.filter(
        (assignment) =>
          assignment.status === "COMPLETED",
      ).length;

      const activeAssignment = employeeAssignments.find(
        (assignment) => {
          const task = taskMap.get(assignment.taskId);

          return (
            assignment.status === "ACCEPTED" &&
            task &&
            ["OPEN", "IN_PROGRESS"].includes(task.status)
          );
        },
      );

      const activeTask = activeAssignment
        ? taskMap.get(activeAssignment.taskId)
        : undefined;

      const isAvailable = profile?.isAvailable ?? false;

      return {
        id: employee.id,
        name: profile?.fullName || employee.username,
        email: employee.email,
        task: activeTask
          ? activeTask.name
          : "No active task",
        completed,
        status: isAvailable ? "Available" : "Unavailable",
        statusColor: isAvailable
          ? "available"
          : "unavailable",
      };
    });

    return NextResponse.json(employeeData);
  } catch (error) {
    console.error("Error fetching employees:", error);

    return NextResponse.json(
      { message: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "OWNER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 400 },
      );
    }

    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: "Employee ID is required" },
        { status: 400 },
      );
    }

    const employee = await db.orm.public.User.where({
      id: employeeId,
      businessId,
      role: "EMPLOYEE",
    }).first();

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 },
      );
    }

    const assignments = await db.orm.public.TaskAssignment.where(
      { employeeId },
    ).all();

    if (assignments.length > 0) {
      return NextResponse.json(
        {
          message:
            "This employee has task assignment history and cannot be permanently deleted. Remove their access or deactivate them instead.",
        },
        { status: 409 },
      );
    }

    // Confirm that your generated ORM supports .delete().
    await db.orm.public.EmployeeProfile.where({
      userId: employeeId,
    }).delete();

    await db.orm.public.User.where({
      id: employeeId,
      businessId,
      role: "EMPLOYEE",
    }).delete();

    return NextResponse.json({
      message: "Employee removed successfully",
    });
  } catch (error) {
    console.error("Error removing employee:", error);

    return NextResponse.json(
      { message: "Failed to remove employee" },
      { status: 500 },
    );
  }
}