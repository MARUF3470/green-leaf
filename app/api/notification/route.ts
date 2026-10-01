import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/notification
// GET /api/notification?unread=true   -> only unread
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const filter: Record<string, unknown> = { userId: session.user.id };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const notifications = await db.orm.public.Notification.where(filter)
      .orderBy((notification) => notification.createdAt.desc())
      .all();

    const unreadCount = unreadOnly
      ? notifications.length
      : notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// PATCH /api/notification
// Body: { id: string }        -> mark one notification as read
// Body: { markAllRead: true } -> mark every notification as read for this user
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (body?.markAllRead === true) {
      await db.orm.public.Notification.where({
        userId: session.user.id,
        isRead: false,
      }).updateAll({ isRead: true });

      return NextResponse.json({ success: true });
    }

    const id = body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Provide an 'id' or set markAllRead: true" },
        { status: 400 },
      );
    }

    // Ownership check: a user can only mark their own notifications as read.
    const notification = await db.orm.public.Notification.where({ id }).first();

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    await db.orm.public.Notification.where({ id }).update({ isRead: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
