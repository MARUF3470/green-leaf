import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/employee/tasks
// Returns the logged-in employee's task assignments, joined with task info.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can view assigned tasks." },
        { status: 403 }
      );
    }

    const assignments = await db.orm.public.TaskAssignment
      .where({ employeeId: session.user.id })
      .include("task")
      .all();

    const tasks = assignments.map((assignment: any) => ({
      assignmentId: assignment.id,
      taskId: assignment.task.id,
      title: assignment.task.name,
      address: assignment.task.locationAddress,
      durationMinutes: assignment.task.durationMinutes,
      payoutAmount: Number(assignment.payoutAmount),
      status: assignment.status, // PENDING | ACCEPTED | REJECTED | CANCELLED | COMPLETED
      scheduledStart: assignment.task.scheduledStart,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch employee tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}