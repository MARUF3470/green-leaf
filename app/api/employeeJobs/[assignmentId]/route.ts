import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { createNotification } from "@/app/server/notification-helper";

type AssignmentAction =
  | "ACCEPT"
  | "REJECT"
  | "START"
  | "COMPLETE";

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

    const body = await request.json();

    const action = body.action as AssignmentAction;

    const allowedActions: AssignmentAction[] = [
      "ACCEPT",
      "REJECT",
      "START",
      "COMPLETE",
    ];

    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      );
    }

    /*
     * Get employee assignment
     */
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

    /*
     * Get task
     */
    const task = await db.orm.public.Task
      .where({
        id: assignment.taskId,
      })
      .first();

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    let newAssignmentStatus:
      | "PENDING"
      | "ACCEPTED"
      | "REJECTED"
      | "CANCELLED"
      | "IN_PROGRESS"
      | "COMPLETED";

    let newTaskStatus:
      | "DRAFT"
      | "OPEN"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED";

    switch (action) {
      case "ACCEPT":
        if (assignment.status !== "PENDING") {
          return NextResponse.json(
            {
              message:
                "This job request is no longer pending",
            },
            { status: 400 }
          );
        }

        newAssignmentStatus = "ACCEPTED";

        // Task remains open until employee starts it
        newTaskStatus = "OPEN";

        break;

      case "REJECT":
        if (assignment.status !== "PENDING") {
          return NextResponse.json(
            {
              message:
                "This job request is no longer pending",
            },
            { status: 400 }
          );
        }

        newAssignmentStatus = "REJECTED";
        newTaskStatus = "OPEN";

        break;

      case "START":
        if (assignment.status !== "ACCEPTED") {
          return NextResponse.json(
            {
              message:
                "You must accept the job before starting it",
            },
            { status: 400 }
          );
        }

        newAssignmentStatus = "IN_PROGRESS";
        newTaskStatus = "IN_PROGRESS";

        break;

      case "COMPLETE":
        if (assignment.status !== "IN_PROGRESS") {
          return NextResponse.json(
            {
              message:
                "Only an in-progress job can be completed",
            },
            { status: 400 }
          );
        }

        newAssignmentStatus = "COMPLETED";
        newTaskStatus = "COMPLETED";

        break;
    }

    /*
     * Update employee assignment
     */
    if (newAssignmentStatus === "COMPLETED") {
      /*
       * Your ORM uses Temporal.Instant for timestamp fields.
       *
       * Replace this with the Temporal implementation used
       * by your project if the import path is different.
       */
      const { Temporal } = await import("temporal-polyfill");

      await db.orm.public.TaskAssignment
        .where({
          id: assignmentId,
          employeeId: session.user.id,
        })
        .update({
          status: newAssignmentStatus,
          completedAt:
            Temporal.Instant.fromEpochMilliseconds(
              Date.now()
            ),
        });
    } else {
      await db.orm.public.TaskAssignment
        .where({
          id: assignmentId,
          employeeId: session.user.id,
        })
        .update({
          status: newAssignmentStatus,
        });
    }

    /*
     * Update parent Task status
     */
    await db.orm.public.Task
      .where({
        id: task.id,
      })
      .update({
        status: newTaskStatus,
      });

    /*
     * Get employee profile so the owner receives
     * the employee's actual name.
     */
    const employeeProfile =
      await db.orm.public.EmployeeProfile
        .where({
          userId: session.user.id,
        })
        .first();

    const employeeName =
      employeeProfile?.fullName ??
      session.user.email ??
      "Employee";

    /*
     * Notify business owners
     */
    const owners = await db.orm.public.User
      .where({
        businessId: task.businessId,
        role: "OWNER",
      })
      .all();

    let notificationTitle = "";
    let notificationBody = "";

    switch (action) {
      case "ACCEPT":
        notificationTitle = "Job request accepted";
        notificationBody =
          `${employeeName} accepted the job "${task.name}".`;
        break;

      case "REJECT":
        notificationTitle = "Job request rejected";
        notificationBody =
          `${employeeName} rejected the job "${task.name}".`;
        break;

      case "START":
        notificationTitle = "Job started";
        notificationBody =
          `${employeeName} started the job "${task.name}".`;
        break;

      case "COMPLETE":
        notificationTitle = "Job completed";
        notificationBody =
          `${employeeName} completed the job "${task.name}".`;
        break;
    }

    await Promise.all(
      owners.map((owner) =>
        createNotification({
          businessId: task.businessId,
          userId: owner.id,
          type: "TASK_COMPLETED",
          title: notificationTitle,
          body: notificationBody,
          taskId: task.id,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
      assignmentId,
      assignmentStatus: newAssignmentStatus,
      taskStatus: newTaskStatus,
    });
  } catch (error) {
    console.error("Employee job update error:", error);

    return NextResponse.json(
      {
        message: "Failed to update job",
      },
      { status: 500 }
    );
  }
}