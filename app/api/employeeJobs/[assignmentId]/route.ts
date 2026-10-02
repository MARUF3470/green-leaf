import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

type AssignmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "IN_PROGRESS"
  | "COMPLETED";

type AssignmentAction = "ACCEPT" | "REJECT" | "START" | "COMPLETE";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { assignmentId } = await params;

    const body = (await request.json()) as {
      action?: AssignmentAction;
    };

    const { action } = body;

    const allowedActions: AssignmentAction[] = [
      "ACCEPT",
      "REJECT",
      "START",
      "COMPLETE",
    ];

    if (!action || !allowedActions.includes(action)) {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      );
    }

    const assignment = await db.orm.public.TaskAssignment
      .where({
        id: assignmentId,
        employeeId: session.user.id,
      })
      .first();

    if (!assignment) {
      return NextResponse.json(
        { message: "Job assignment not found" },
        { status: 404 }
      );
    }

    let newStatus: AssignmentStatus;

    switch (action) {
      case "ACCEPT":
        if (assignment.status !== "PENDING") {
          return NextResponse.json(
            { message: "This job is no longer pending" },
            { status: 400 }
          );
        }

        newStatus = "ACCEPTED";
        break;

      case "REJECT":
        if (assignment.status !== "PENDING") {
          return NextResponse.json(
            { message: "This job is no longer pending" },
            { status: 400 }
          );
        }

        newStatus = "REJECTED";
        break;

      case "START":
        if (assignment.status !== "ACCEPTED") {
          return NextResponse.json(
            { message: "Accept the job before starting it" },
            { status: 400 }
          );
        }

        newStatus = "IN_PROGRESS";
        break;

      case "COMPLETE":
        if (assignment.status !== "IN_PROGRESS") {
          return NextResponse.json(
            { message: "Only in-progress jobs can be completed" },
            { status: 400 }
          );
        }

        newStatus = "COMPLETED";
        break;
    }

    if (newStatus === "COMPLETED") {
      const completedAt = Temporal.Now.instant();

      await db.orm.public.TaskAssignment
        .where({
          id: assignmentId,
          employeeId: session.user.id,
        })
        .update({
          status: newStatus,
          completedAt,
        });
    } else {
      await db.orm.public.TaskAssignment
        .where({
          id: assignmentId,
          employeeId: session.user.id,
        })
        .update({
          status: newStatus,
        });
    }

    return NextResponse.json({
      message: "Job updated successfully",
      assignmentId,
      status: newStatus,
    });
  } catch (error) {
    console.error("Employee job update error:", error);

    return NextResponse.json(
      { message: "Failed to update job" },
      { status: 500 }
    );
  }
}