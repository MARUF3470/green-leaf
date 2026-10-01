import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    // -----------------------------------------
    // 1. Get logged-in session
    // -----------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Make sure user is an employee
    // -----------------------------------------

    if (session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 3. Get employee directly from database
    // -----------------------------------------
    //
    // We do NOT use:
    //
    // session.user.businessId
    //
    // because businessId may not be included
    // in the NextAuth session.
    //

    const employee = await db.orm.public.User
      .where({
        id: session.user.id,
      })
      .first();

    if (!employee) {
      return NextResponse.json(
        {
          message: "Employee account not found",
        },
        { status: 404 },
      );
    }

    // -----------------------------------------
    // 4. Get business ID from database
    // -----------------------------------------

    const businessId = employee.businessId;

    if (!businessId) {
      return NextResponse.json(
        {
          message:
            "Employee is not associated with a business",
        },
        { status: 403 },
      );
    }

    console.log("Employee ID:", session.user.id);
    console.log("Employee business ID:", businessId);

    // -----------------------------------------
    // 5. Get employee assignments
    // -----------------------------------------

    const assignments =
      await db.orm.public.TaskAssignment
        .where({
          employeeId: session.user.id,
        })
        .all();

    // -----------------------------------------
    // No assignments
    // -----------------------------------------

    if (assignments.length === 0) {
      return NextResponse.json({
        totalEarned: 0,
        pending: 0,
        payments: [],
      });
    }

    // -----------------------------------------
    // 6. Get tasks belonging to the business
    // -----------------------------------------

    const tasks =
      await db.orm.public.Task
        .where({
          businessId,
        })
        .all();

    // -----------------------------------------
    // 7. Create task lookup
    // -----------------------------------------

    const taskById = new Map(
      tasks.map((task) => [
        task.id,
        task,
      ]),
    );

    // -----------------------------------------
    // 8. Build payment history
    // -----------------------------------------

    const payments = assignments
      .map((assignment) => {
        const task = taskById.get(
          assignment.taskId,
        );

        // Ignore assignments where the task
        // doesn't belong to this employee's business.
        if (!task) {
          return null;
        }

        const assignmentStatus =
          String(assignment.status);

        const payoutStatus = String(
          assignment.payoutStatus ?? "UNPAID",
        );

        // -----------------------------------------
        // Completion status
        // -----------------------------------------

        const isCompleted =
          assignmentStatus.toUpperCase() ===
          "COMPLETED";

        // -----------------------------------------
        // Payment status
        // -----------------------------------------

        const isPaid =
          payoutStatus.toUpperCase() === "PAID";

        // -----------------------------------------
        // Payment amount
        // -----------------------------------------

        const amount = Number(
          assignment.payoutAmount ?? 0,
        );

        // -----------------------------------------
        // Payment date
        // -----------------------------------------

        const date =
          assignment.completedAt ??
          task.scheduledStart ??
          task.createdAt;

        // -----------------------------------------
        // Return payment
        // -----------------------------------------

        return {
          id: assignment.id,

          task: task.name,

          address:
            task.locationAddress ?? "",

          date: date
            ? String(date)
            : null,

          durationMinutes: Number(
            task.durationMinutes ?? 0,
          ),

          amount,

          assignmentStatus,

          payoutStatus,

          isCompleted,

          isPaid,

          status: isPaid
            ? "Paid"
            : isCompleted
              ? "Transfer Pending"
              : "Awaiting Completion",
        };
      })
      .filter(
        (
          payment,
        ): payment is NonNullable<
          typeof payment
        > => payment !== null,
      )
      .sort((a, b) => {
        const dateA = a.date
          ? new Date(a.date).getTime()
          : 0;

        const dateB = b.date
          ? new Date(b.date).getTime()
          : 0;

        return dateB - dateA;
      });

    // -----------------------------------------
    // 9. Calculate total earned
    // -----------------------------------------

    const totalEarned = payments
      .filter(
        (payment) =>
          payment.isCompleted,
      )
      .reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    // -----------------------------------------
    // 10. Calculate pending transfers
    // -----------------------------------------

    const pending = payments
      .filter(
        (payment) =>
          payment.isCompleted &&
          !payment.isPaid,
      )
      .reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    // -----------------------------------------
    // 11. Return earnings
    // -----------------------------------------

    return NextResponse.json({
      totalEarned,
      pending,
      payments,
    });
  } catch (error) {
    console.error(
      "Employee earnings API error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to fetch earnings",
      },
      {
        status: 500,
      },
    );
  }
}