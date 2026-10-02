"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Hourglass,
  LineChart,
  User,
  RefreshCw,
} from "lucide-react";

type DashboardStats = {
  activeTasks: number;
  availableStaff: number;
  totalStaff: number;
  weekEarnings: number;
  pendingApprovals: number;
  pendingInstrumentRequests: number;
};

type DashboardTask = {
  id: string;
  name: string;
  person: string;
  durationMinutes: number;
  status: string;
  amount: number;
  updatedAt: string | null;
};

type DashboardActivity = {
  id: string;
  text: string;
  date: string | null;
  time: string;
  active: boolean;
};

type DashboardData = {
  stats: DashboardStats;
  tasks: DashboardTask[];
  activities: DashboardActivity[];
};

const initialStats: DashboardStats = {
  activeTasks: 0,
  availableStaff: 0,
  totalStaff: 0,
  weekEarnings: 0,
  pendingApprovals: 0,
  pendingInstrumentRequests: 0,
};

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "Duration unavailable";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getStatusStyles(status: string) {
  switch (status.toUpperCase()) {
    case "IN_PROGRESS":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "OPEN":
    case "DRAFT":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "CANCELLED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function MerchantDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    stats: initialStats,
    tasks: [],
    activities: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/merchant/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load dashboard.",
        );
      }

      setData({
        stats: {
          ...initialStats,
          ...(result.stats ?? {}),
        },
        tasks: Array.isArray(result.tasks) ? result.tasks : [],
        activities: Array.isArray(result.activities)
          ? result.activities
          : [],
      });

      setOwnerName(result.ownerName ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const stats = [
    {
      title: "Active Tasks",
      value: String(data.stats.activeTasks),
      note: "Open and in progress",
      noteClass: "text-blue-600 dark:text-blue-400",
      icon: Check,
      iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Available Staff",
      value: `${data.stats.availableStaff}/${data.stats.totalStaff}`,
      note: `${Math.max(
        0,
        data.stats.totalStaff - data.stats.availableStaff,
      )} unavailable`,
      noteClass: "text-emerald-600 dark:text-emerald-400",
      icon: User,
      iconClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Week Earnings",
      value: formatCurrency(data.stats.weekEarnings),
      note: "Completed task revenue",
      noteClass: "text-blue-600 dark:text-blue-400",
      icon: LineChart,
      iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Pending Approvals",
      value: String(data.stats.pendingApprovals),
      note: `${data.stats.pendingInstrumentRequests} instrument ${
        data.stats.pendingInstrumentRequests === 1
          ? "request"
          : "requests"
      }`,
      noteClass: "text-orange-600 dark:text-orange-400",
      icon: Hourglass,
      iconClass:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">
              {getGreeting()}
              {ownerName ? `, ${ownerName}` : ""}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void fetchDashboard();
            }}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`mr-2 size-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void fetchDashboard();
              }}
              className="text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
              >
                <div
                  className={`grid size-10 place-items-center rounded-xl ${item.iconClass}`}
                >
                  <Icon size={18} />
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  {loading ? "—" : item.value}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {item.title}
                </p>

                <p className={`mt-3 text-xs font-semibold ${item.noteClass}`}>
                  {item.note}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-bold">Recent Tasks</h2>
              <span className="text-xs text-muted-foreground">
                Latest {data.tasks.length}
              </span>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                Loading tasks...
              </div>
            ) : data.tasks.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                No tasks found.
              </div>
            ) : (
              <div>
                {data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid gap-4 border-b border-border px-6 py-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {task.name}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.person} ·{" "}
                        {formatDuration(task.durationMinutes)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
                        task.status,
                      )}`}
                    >
                      {formatStatus(task.status)}
                    </span>

                    <p className="text-sm font-bold">
                      {formatCurrency(task.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-bold">Activity</h2>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                Loading activity...
              </div>
            ) : data.activities.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                {data.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        activity.active
                          ? "bg-blue-500"
                          : "bg-muted-foreground/25"
                      }`}
                    />

                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-muted-foreground">
                        {activity.text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}