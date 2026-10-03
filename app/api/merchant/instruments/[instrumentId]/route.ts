import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { createNotification } from "@/app/server/notification-helper";

type Action = "APPROVE" | "REJECT";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instrumentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "OWNER") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { instrumentId } = await params;

    const body = await request.json();
    const action = body?.action as Action;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      );
    }

    /*
     * Find the instrument
     */
    const instrument = await db.orm.public.Instrument
      .where({
        id: instrumentId,
      })
      .first();

    if (!instrument) {
      return NextResponse.json(
        { message: "Equipment request not found" },
        { status: 404 }
      );
    }

    /*
     * Make sure the instrument belongs to this owner's business
     */
    const owner = await db.orm.public.User
      .where({
        id: session.user.id,
      })
      .first();

    if (!owner || owner.businessId !== instrument.businessId) {
      return NextResponse.json(
        { message: "You do not have permission to handle this request" },
        { status: 403 }
      );
    }

    /*
     * Only pending requests can be handled
     */
    if (instrument.approval !== "PENDING") {
      return NextResponse.json(
        {
          message: `This equipment request has already been ${instrument.approval.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    const newApproval =
      action === "APPROVE"
        ? "APPROVED"
        : "REJECTED";

    /*
     * Update equipment request
     */
    const updatedInstrument = await db.orm.public.Instrument
      .where({
        id: instrumentId,
      })
      .update({
        approval: newApproval,
      });

    /*
     * Get task information
     */
    let task = null;

    if (instrument.taskId) {
      task = await db.orm.public.Task
        .where({
          id: instrument.taskId,
          businessId: instrument.businessId,
        })
        .first();
    }

    /*
     * Notify the employee who requested it
     */
    if (instrument.addedById) {
      await createNotification({
        businessId: instrument.businessId,
        userId: instrument.addedById,
        type: "INSTRUMENT_DECISION",
        title:
          action === "APPROVE"
            ? "Equipment request approved"
            : "Equipment request declined",
        body:
          action === "APPROVE"
            ? `Your request for ${instrument.quantity} × ${instrument.name} has been approved${task ? ` for "${task.name}"` : ""}.`
            : `Your request for ${instrument.quantity} × ${instrument.name} has been declined${task ? ` for "${task.name}"` : ""}.`,
        taskId: instrument.taskId ?? undefined,
        instrumentId: instrument.id,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Equipment request approved"
          : "Equipment request declined",
      instrument: updatedInstrument,
    });
  } catch (error) {
    console.error("Owner equipment decision error:", error);

    return NextResponse.json(
      {
        message: "Failed to update equipment request",
      },
      { status: 500 }
    );
  }
}