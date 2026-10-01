"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type EmployeeTask = {
  id: string;
  title: string;
  address: string;
  durationMinutes: number;
  earnings?: number;
  payoutAmount?: number;
  status: string;
  scheduledStart?: string | null;
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        dotClass: "bg-blue-500",
      };

    case "ACCEPTED":
      return {
        label: "Accepted",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        dotClass: "bg-emerald-500",
      };

    case "PENDING":
      return {
        label: "Pending",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        dotClass: "bg-amber-500",
      };

    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        dotClass: "bg-emerald-500",
      };

    case "REJECTED":
    case "CANCELLED":
      return {
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        className: "bg-red-500/10 text-red-600 dark:text-red-400",
        dotClass: "bg-red-500",
      };

    default:
      return {
        label: status.replaceAll("_", " "),
        className: "bg-muted text-muted-foreground",
        dotClass: "bg-muted-foreground",
      };
  }
}

export default function EmployeeTasksPage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [availabilityResponse, tasksResponse] = await Promise.all([
        fetch("/api/employeeAvailability", {
          cache: "no-store",
        }),
        fetch("/api/employeeTask", {
          cache: "no-store",
        }),
      ]);

      const availabilityData = await availabilityResponse.json();
      const tasksData = await tasksResponse.json();
console.log(tasksData)
      if (!availabilityResponse.ok) {
        throw new Error(
          availabilityData?.error ?? "Failed to load availability.",
        );
      }

      if (!tasksResponse.ok) {
        throw new Error(tasksData?.error ?? "Failed to load tasks.");
      }

      setIsAvailable(availabilityData.isAvailable ?? true);

      // Expected response: { tasks: EmployeeTask[] }
      setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAvailabilityChange = async (checked: boolean) => {
    const previousValue = isAvailable;

    setIsAvailable(checked);
    setIsUpdatingAvailability(true);
    setError("");

    try {
      const response = await fetch("/api/employee/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: checked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update availability.");
      }

      setIsAvailable(data.isAvailable);
    } catch (err) {
      setIsAvailable(previousValue);
      setError(
        err instanceof Error ? err.message : "Failed to update availability.",
      );
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-lg font-bold tracking-normal">
              Availability Status
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {isUpdatingAvailability
                ? "Updating your availability..."
                : isAvailable
                  ? "You're visible for new tasks"
                  : "You're unavailable for new tasks"}
            </p>
          </div>

          <Switch
            checked={isAvailable}
            onCheckedChange={handleAvailabilityChange}
            disabled={isLoading || isUpdatingAvailability}
            aria-label="Toggle availability"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => void fetchData()}
            className="shrink-0 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="mt-8">
        <div>
          <h2 className="text-2xl font-bold tracking-normal">My Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading assigned tasks..."
              : `${tasks.length} assigned`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <Card className="mt-6 shadow-sm">
            <CardContent className="p-8 text-center">
              <h3 className="font-semibold">No tasks assigned yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your assigned tasks will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {tasks.map((task) => {
              const statusStyle = getStatusStyle(task.status);

              return (
                <Card key={task.id} className="shadow-sm">
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold">{task.title}</h3>

                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin
                          size={15}
                          className="shrink-0 text-pink-500"
                        />
                        <span>{task.address || "No address provided"}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={15} />
                        <span>
                          {formatDuration(task.durationMinutes)}
                        </span>
                      </div>

                      {task.scheduledStart && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Scheduled:{" "}
                          {new Date(task.scheduledStart).toLocaleString(
                            "en-AU",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(task.payoutAmount ?? task.earnings ?? 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your earnings
                        </p>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`gap-1.5 rounded-full ${statusStyle.className}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${statusStyle.dotClass}`}
                        />
                        {statusStyle.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}