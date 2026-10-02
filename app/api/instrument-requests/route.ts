import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId, name, quantity } = await request.json();

    if (
      !taskId ||
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return NextResponse.json(
        { message: "Task, instrument name, and valid quantity are required" },
        { status: 400 }
      );
    }

    const assignment = await db.orm.public.TaskAssignment
      .where({
        taskId,
        employeeId: session.user.id,
      })
      .first();

    if (
      !assignment ||
      !["ACCEPTED", "IN_PROGRESS"].includes(assignment.status)
    ) {
      return NextResponse.json(
        { message: "You must have an active assignment for this job" },
        { status: 403 }
      );
    }

    const task = await db.orm.public.Task
      .where({ id: taskId })
      .first();

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    // Create the instrument request using your Instrument model.
    // Adjust these fields to match your exact Prisma schema.
  const instrument = await db.orm.public.Instrument.create({
  businessId: task.businessId,
  taskId,
  name: name.trim(),
  quantity: Number(quantity),
  approval: "PENDING",
  addedById: session.user.id,
  source: "EMPLOYEE_ADDED",
});

    return NextResponse.json(
      {
        message: "Instrument request submitted",
        instrument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Instrument request error:", error);

    return NextResponse.json(
      { message: "Failed to submit instrument request" },
      { status: 500 }
    );
  }
}