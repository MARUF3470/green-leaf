import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const EMPLOYEE_NOTIFICATION_TYPES = [
  "PAYMENT_SENT",
  "TASK_ASSIGNED",
  "INSTRUMENT_DECISION",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notifications = await db.orm.public.Notification
      .where({
        userId: session.user.id,
      })
      .all();

    const filteredNotifications = notifications
      .filter((notification) =>
        EMPLOYEE_NOTIFICATION_TYPES.includes(notification.type)
      )
      .sort(
        (a, b) =>
          b.createdAt.epochMilliseconds - a.createdAt.epochMilliseconds
      );

    return NextResponse.json({
      notifications: filteredNotifications,
      unreadCount: filteredNotifications.filter(
        (notification) => !notification.isRead
      ).length,
    });
  } catch (error) {
    console.error("Employee notifications error:", error);

    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}