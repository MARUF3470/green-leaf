"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const filters = [
  "All",
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

type TaskStatus = (typeof filters)[number];

type MerchantTask = {
  id: string;
  task: string;
  address: string;
  employee: string;
  durationMinutes: number;
  status: Exclude<TaskStatus, "All">;
  price: number;
  scheduledStart: string | null;
  createdAt: string | null;
};

function getStatusClass(status: string) {
  switch (status) {
    case "Accepted":
    case "In Progress":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "Pending":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "Completed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getDotClass(status: string) {
  switch (status) {
    case "Accepted":
    case "In Progress":
      return "bg-blue-500";
    case "Pending":
      return "bg-orange-500";
    case "Completed":
      return "bg-emerald-500";
    default:
      return "bg-muted-foreground/50";
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "—";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export default function MerchantTasksPage() {
  const [tasks, setTasks] = useState<MerchantTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskStatus>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const handleDeleteTask = async (task: MerchantTask) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.task}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingTaskId(task.id);
      setError("");

      const response = await fetch("/api/merchant/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: task.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete task.");
      }

      // Remove the deleted task from the current UI.
      setTasks((currentTasks) =>
        currentTasks.filter((item) => item.id !== task.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the task.",
      );
    } finally {
      setDeletingTaskId(null);
    }
  };
  const fetchTasks = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/merchant/tasks", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load tasks.");
      }

      setTasks(Array.isArray(result.tasks) ? result.tasks : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === "All") return tasks;

    return tasks.filter((task) => task.status === activeFilter);
  }, [tasks, activeFilter]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading tasks..."
              : `${tasks.length} total ${
                  tasks.length === 1 ? "task" : "tasks"
                }`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void fetchTasks();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link href="/merchant/add-task">
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus size={16} />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            onClick={() => setActiveFilter(filter)}
            className={
              activeFilter === filter
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-card"
            }
          >
            {filter}
            {filter === "All" ? ` (${tasks.length})` : ""}
          </Button>
        ))}
      </div>

      {error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void fetchTasks();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      <Card className="mt-7 overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {tasks.length === 0
                      ? "No tasks have been created yet."
                      : `No ${activeFilter.toLowerCase()} tasks found.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="py-5">
                      <div>
                        <p className="font-semibold text-foreground">
                          {task.task}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.address || "No address provided"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {task.employee}
                    </TableCell>

                    <TableCell>
                      {formatDuration(task.durationMinutes)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 rounded-full ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${getDotClass(
                            task.status,
                          )}`}
                        />
                        {task.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-bold">
                      {formatCurrency(task.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingTaskId === task.id}
                        onClick={() => void handleDeleteTask(task)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
