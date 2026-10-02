"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Circle,
  Clock,
  CreditCard,
  RefreshCw,
  Wrench,
  X,
  Bell,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationResponse = {
  notifications: Notification[];
  unreadCount: number;
};

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "TASK_ACCEPTED":
    case "TASK_COMPLETED":
      return {
        Icon: Check,
        className: "bg-emerald-500 text-white",
      };

    case "TASK_REJECTED":
    case "TASK_CANCELLED":
      return {
        Icon: X,
        className: "bg-rose-500 text-white",
      };

    case "INSTRUMENT_REQUEST":
    case "INSTRUMENT_DECISION":
      return {
        Icon: Wrench,
        className: "bg-violet-500 text-white",
      };

    case "AVAILABILITY_CHANGED":
      return {
        Icon: RefreshCw,
        className: "bg-blue-500 text-white",
      };

    case "PAYMENT_SENT":
      return {
        Icon: CreditCard,
        className: "bg-emerald-500 text-white",
      };

    case "SUBSCRIPTION":
      return {
        Icon: Bell,
        className: "bg-indigo-500 text-white",
      };

    case "TASK_ASSIGNED":
    default:
      return {
        Icon: Clock,
        className: "bg-blue-500 text-white",
      };
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MerchantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/notification", {
        cache: "no-store",
      });

      const data: NotificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to fetch notifications",
        );
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find(
      (item) => item.id === notificationId,
    );

    if (!notification || notification.isRead) return;

    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await fetch("/api/notification", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: notificationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to mark notification as read",
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);
      setError("");

      const response = await fetch("/api/notification", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllRead: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to mark all as read",
        );
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notifications",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount} unread
          </p>
        </div>

        <Button
          variant="link"
          disabled={unreadCount === 0 || markingAll}
          onClick={markAllAsRead}
          className="gap-2 px-0 text-blue-600 dark:text-blue-400"
        >
          <CheckCheck size={16} />
          {markingAll ? "Marking..." : "Mark all as read"}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <Card className="mt-7 overflow-hidden p-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Bell className="mb-3 size-10 text-muted-foreground" />

              <h2 className="font-semibold">
                You&apos;re all caught up
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                New notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const { Icon, className } = getNotificationIcon(
                notification.type,
              );

              return (
                <div
                  key={notification.id}
                  className={`flex items-center gap-4 border-b border-border px-5 py-5 last:border-b-0 sm:px-7 ${
                    !notification.isRead
                      ? "bg-blue-500/[0.035]"
                      : ""
                  }`}
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${className}`}
                  >
                    <Icon size={17} strokeWidth={2.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-6 sm:text-base ${
                        notification.isRead
                          ? "font-normal text-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>

                    {notification.body && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingId === notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className="shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      {updatingId === notification.id
                        ? "Updating..."
                        : "Mark read"}
                    </Button>
                  )}

                  {!notification.isRead && (
                    <Circle
                      size={9}
                      className="hidden shrink-0 fill-blue-500 text-blue-500 sm:block"
                    />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </main>
  );
}