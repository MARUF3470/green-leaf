import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignments = await db.orm.public.TaskAssignment
      .where({
        employeeId: session.user.id,
      })
      .all();

    const jobs = await Promise.all(
      assignments.map(async (assignment) => {
        const task = await db.orm.public.Task
          .where({ id: assignment.taskId })
          .first();

        return {
          id: assignment.id,
          taskId: assignment.taskId,
          status: assignment.status,
          payoutAmount: assignment.payoutAmount,
          task: task
            ? {
                name: task.name,
                locationAddress: task.locationAddress,
                scheduledStart: task.scheduledStart,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Employee jobs error:", error);

    return NextResponse.json(
      { message: "Failed to fetch assigned jobs" },
      { status: 500 }
    );
  }
}