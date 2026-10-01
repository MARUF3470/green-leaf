import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/app/server/notification-helper";


export const dynamic = "force-dynamic";

// GET /api/employee/availability
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.orm.public.EmployeeProfile
    .where({ userId: session.user.id })
    .first();

  return NextResponse.json({ isAvailable: profile?.isAvailable ?? true });
}

// PATCH /api/employee/availability
// Body: { isAvailable: boolean }
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: "Only employees can update availability." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.isAvailable !== "boolean") {
    return NextResponse.json(
      { error: "isAvailable must be true or false" },
      { status: 400 }
    );
  }

  try {
    await db.orm.public.EmployeeProfile
      .where({ userId: session.user.id })
      .update({
        isAvailable: body.isAvailable,
        availabilityUpdatedAt: new Date() as any,
      });

    // Let the owner know when an employee goes unavailable, so they
    // don't assign a new task to someone who can't take it.
    if (!body.isAvailable && session.user.businessId) {
      const owners = await db.orm.public.User
        .where({ businessId: session.user.businessId, role: "OWNER" })
        .all();

      await Promise.all(
        owners.map((owner: any) =>
          createNotification({
            businessId: session.user.businessId!,
            userId: owner.id,
            type: "AVAILABILITY_CHANGED",
            title: "Employee marked unavailable",
            body: `${session.user.name ?? "An employee"} is no longer available for new tasks.`,
          })
        )
      );
    }

    return NextResponse.json({ success: true, isAvailable: body.isAvailable });
  } catch (error) {
    console.error("Failed to update availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}