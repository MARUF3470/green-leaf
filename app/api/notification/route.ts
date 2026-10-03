import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/*
 * GET /api/notification
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /*
     * Get all notifications belonging to the
     * currently logged-in user.
     */
    const notifications = await db.orm.public.Notification
      .where({
        userId: session.user.id,
      })
      .orderBy((notification) =>
        notification.createdAt.desc()
      )
      .all();

    /*
     * Notification types that should be visible
     * to an EMPLOYEE.
     */
    const employeeNotificationTypes = [
      "TASK_ASSIGNED",
      "TASK_ACCEPTED",
      "TASK_REJECTED",
      "TASK_CANCELLED",
      "TASK_COMPLETED",
      "INSTRUMENT_DECISION",
      "PAYMENT_SENT",
      "SUBSCRIPTION",
    ];

    /*
     * Notification types that should be visible
     * to an OWNER.
     */
    const ownerNotificationTypes = [
      "TASK_ASSIGNED",
      "TASK_ACCEPTED",
      "TASK_REJECTED",
      "TASK_CANCELLED",
      "TASK_COMPLETED",
      "INSTRUMENT_REQUEST",
      "INSTRUMENT_DECISION",
      "AVAILABILITY_CHANGED",
      "PAYMENT_SENT",
      "SUBSCRIPTION",
    ];

    let filteredNotifications = notifications;

    /*
     * Filter based on logged-in user's role.
     */
    if (session.user.role === "EMPLOYEE") {
      filteredNotifications = notifications.filter(
        (notification) =>
          employeeNotificationTypes.includes(
            notification.type
          )
      );
    }

    if (session.user.role === "OWNER") {
      filteredNotifications = notifications.filter(
        (notification) =>
          ownerNotificationTypes.includes(
            notification.type
          )
      );
    }

    /*
     * Calculate unread count AFTER filtering.
     */
    const unreadCount = filteredNotifications.filter(
      (notification) => !notification.isRead
    ).length;

    return NextResponse.json({
      notifications: filteredNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Failed to fetch notifications:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}


export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    /*
     * Mark all notifications as read
     */
    if (body?.markAllRead === true) {
      await db.orm.public.Notification
        .where({
          userId: session.user.id,
          isRead: false,
        })
        .updateAll({
          isRead: true,
        });

      return NextResponse.json({
        success: true,
      });
    }

    /*
     * Mark a single notification as read
     */
    const id = body?.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error:
            "Provide an 'id' or set markAllRead: true",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure this notification actually belongs
     * to the logged-in user.
     */
    const notification =
      await db.orm.public.Notification
        .where({
          id,
          userId: session.user.id,
        })
        .first();

    if (!notification) {
      return NextResponse.json(
        {
          error: "Notification not found",
        },
        { status: 404 }
      );
    }

    await db.orm.public.Notification
      .where({
        id,
        userId: session.user.id,
      })
      .update({
        isRead: true,
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to update notification:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update notification",
      },
      { status: 500 }
    );
  }
}