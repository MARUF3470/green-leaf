import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { createNotification } from "@/app/server/notification-helper";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      taskId,
      name,
      quantity,
      price,
    } = body;

    if (!taskId) {
      return NextResponse.json(
        { message: "Task is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Instrument name is required" },
        { status: 400 }
      );
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return NextResponse.json(
        { message: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return NextResponse.json(
        { message: "Amount must be a valid positive number" },
        { status: 400 }
      );
    }

    // Check that this employee is actually assigned to the task
    const assignment = await db.orm.public.TaskAssignment
      .where({
        taskId,
        employeeId: session.user.id,
      })
      .first();

    if (!assignment) {
      return NextResponse.json(
        { message: "You are not assigned to this task" },
        { status: 403 }
      );
    }

    if (
      assignment.status !== "ACCEPTED" &&
      assignment.status !== "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          message:
            "You can only request equipment for an accepted or active job",
        },
        { status: 400 }
      );
    }

    const task = await db.orm.public.Task
      .where({
        id: taskId,
      })
      .first();

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    /*
     * Create equipment request
     */
    const instrument = await db.orm.public.Instrument.create({
      businessId: task.businessId,
      taskId: taskId,
      name: name.trim(),
      quantity: parsedQuantity,
      price: parsedPrice,
      approval: "PENDING",
      addedById: session.user.id,
      source: "EMPLOYEE_ADDED",
    });

    /*
     * Get business owners
     */
    const owners = await db.orm.public.User
      .where({
        businessId: task.businessId,
        role: "OWNER",
      })
      .all();

    /*
     * Notify all business owners
     */
await Promise.all(
  owners.map((owner) =>
    createNotification({
      businessId: task.businessId,
      userId: owner.id,
      type: "INSTRUMENT_REQUEST",
      title: "New equipment request",
      body: `${session.user.email ?? "An employee"} requested ${parsedQuantity} × ${name.trim()} for "${task.name}". Amount: $${parsedPrice.toFixed(2)}.`,
      taskId: task.id,
      instrumentId: instrument.id, // ← ADD THIS
    })
  )
);
    return NextResponse.json(
      {
        success: true,
        message: "Equipment request submitted successfully",
        instrument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Employee equipment request error:", error);

    return NextResponse.json(
      {
        message: "Failed to submit equipment request",
      },
      { status: 500 }
    );
  }
}