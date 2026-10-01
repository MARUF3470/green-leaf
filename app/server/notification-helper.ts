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
  userId: string; // recipient
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
};

// Call this from other routes whenever something notification-worthy happens
// (task assigned, employee accepted/rejected, cancellation, instrument request, etc.)
// Example:
//   await createNotification({
//     businessId,
//     userId: assignment.employeeId,
//     type: "TASK_ASSIGNED",
//     title: "New task assigned",
//     body: `You've been assigned to "${task.name}"`,
//     taskId: task.id,
//   });
export async function createNotification(params: CreateNotificationParams) {
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
  } catch (error) {
    // Notifications are a side effect — don't let a failure here
    // break the primary action (e.g. task creation, assignment, etc.)
    console.error("Failed to create notification:", error);
  }
}

// Convenience helper for notifying every employee assigned to a task
// (e.g. when a task is cancelled by the owner).
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

  await Promise.all(
    assignments
      .filter((a: any) => a.employeeId !== params.excludeUserId)
      .map((a: any) =>
        createNotification({
          businessId: params.businessId,
          userId: a.employeeId,
          type: params.type,
          title: params.title,
          body: params.body,
          taskId: params.taskId,
        }),
      ),
  );
}
