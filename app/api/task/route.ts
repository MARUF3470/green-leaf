import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

type CreateTaskBody = {
  name: string;
  description?: string;
  locationAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  scheduledStart?: string | null;
  durationMinutes: number;
  status?: "DRAFT" | "OPEN";
  price: number;
  assignments: {
    employeeId: string;
    payoutAmount: number;
  }[];
  instruments?: {
    name: string;
    quantity: number;
    price?: number;
  }[];
};

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only business owners can create tasks." },
        { status: 403 },
      );
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: "Your account is not associated with a business." },
        { status: 400 },
      );
    }

    // 2. Read and validate the request body
    const body = (await request.json()) as CreateTaskBody;

    const {
      name,
      description,
      locationAddress,
      latitude,
      longitude,
      scheduledStart,
      durationMinutes,
      status = "OPEN",
      price,
      assignments = [],
      instruments = [],
    } = body;

    if (
      !name?.trim() ||
      !locationAddress?.trim() ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        { error: "Please provide valid task details and price." },
        { status: 400 },
      );
    }

    if (!["DRAFT", "OPEN"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid task status." },
        { status: 400 },
      );
    }

    if (!Array.isArray(assignments) || !Array.isArray(instruments)) {
      return NextResponse.json(
        { error: "Assignments and instruments must be arrays." },
        { status: 400 },
      );
    }

    if (
      assignments.some(
        (a) =>
          !a.employeeId ||
          typeof a.payoutAmount !== "number" ||
          !Number.isFinite(a.payoutAmount) ||
          a.payoutAmount < 0,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid employee assignment or payout amount." },
        { status: 400 },
      );
    }

    if (
      instruments.some(
        (i) =>
          !i.name?.trim() ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          (i.price !== undefined &&
            (typeof i.price !== "number" ||
              !Number.isFinite(i.price) ||
              i.price < 0)),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Each instrument needs a name, valid quantity, and valid price.",
        },
        { status: 400 },
      );
    }

    const startDate = scheduledStart
      ? Temporal.Instant.from(new Date(scheduledStart).toISOString())
      : null;

    if (scheduledStart && Number.isNaN(Date.parse(scheduledStart))) {
      return NextResponse.json(
        { error: "Invalid scheduled start date." },
        { status: 400 },
      );
    }

    // 3. Verify that every assigned employee belongs to this business
    const employeeIds = [...new Set(assignments.map((a) => a.employeeId))];

    for (const employeeId of employeeIds) {
      const employee = await db.orm.public.User.where({
        id: employeeId,
        role: "EMPLOYEE",
        whoAdded: session.user.id,
      }).first();

      if (!employee) {
        return NextResponse.json(
          {
            error:
              "One or more selected employees do not belong to your business.",
          },
          { status: 400 },
        );
      }
    }

    // 4. Create the task
    const task = await db.orm.public.Task.create({
      businessId,
      name: name.trim(),
      description: description?.trim() || null,
      locationAddress: locationAddress.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      scheduledStart: startDate,
      durationMinutes,
      status,
    });

    // 5. Create the financial record
    await db.orm.public.TaskFinance.create({
      taskId: task.id,
      price,
    });

    // 6. Create employee assignments
    for (const assignment of assignments) {
      await db.orm.public.TaskAssignment.create({
        taskId: task.id,
        employeeId: assignment.employeeId,
        payoutAmount: assignment.payoutAmount,
        status: "PENDING",
        payoutStatus: "UNPAID",
      });
    }

    // 7. Add instruments listed by the owner
    for (const instrument of instruments) {
      await db.orm.public.Instrument.create({
        businessId,
        taskId: task.id,
        name: instrument.name.trim(),
        quantity: instrument.quantity,
        price: instrument.price ?? null,
        source: "OWNER_LISTED",
        approval: "APPROVED",
        addedById: session.user.id,
      });
    }

    return NextResponse.json(
      {
        message: "Task created successfully.",
        taskId: task.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating task:", error);

    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 },
    );
  }
}
