// src/lib/notifications.ts
"use server";

import { db } from "@/src/prisma/db";

type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_ACCEPTED"
  | "TASK_REJECTED"
  | "TASK_CANCELLED"
  | "TASK_COMPLETED"
  | "INSTRUMENT_REQUEST"
  | "INSTRUMENT_DECISION"
  | "AVAILABILITY_CHANGED"
  | "PAYMENT_SENT"
  | "SUBSCRIPTION";

type CreateNotificationParams = {
  businessId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
};

export async function createNotification(
  params: CreateNotificationParams,
) {
  try {
    await db.orm.public.Notification.create({
      businessId: params.businessId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      taskId: params.taskId ?? null,
      isRead: false,
    });

    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}

/**
 * Notify all owners of a business.
 * Use this for employee actions that require the owner's attention.
 */
export async function notifyBusinessOwners(params: {
  businessId: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
}) {
  const owners = await db.orm.public.User.where({
    businessId: params.businessId,
    role: "OWNER",
  }).all();

  await Promise.all(
    owners.map((owner) =>
      createNotification({
        ...params,
        userId: owner.id,
      }),
    ),
  );
}

/**
 * Notify every employee assigned to a task.
 */
export async function notifyTaskAssignees(params: {
  businessId: string;
  taskId: string;
  type: NotificationType;
  title: string;
  body?: string;
  excludeUserId?: string;
}) {
  const assignments = await db.orm.public.TaskAssignment.where({
    taskId: params.taskId,
  }).all();

  const recipients = [
    ...new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.employeeId !== params.excludeUserId,
        )
        .map((assignment) => assignment.employeeId),
    ),
  ];

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        businessId: params.businessId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        taskId: params.taskId,
      }),
    ),
  );
}