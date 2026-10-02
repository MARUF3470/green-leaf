"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
};

type Job = {
  id: string;
  taskId: string;
  status: string;
  payoutAmount?: number | null;
  task?: {
    name?: string;
    locationAddress?: string;
    scheduledStart?: string;
  };
};

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<string | null>("");
  const [instrumentName, setInstrumentName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [requestMessage, setRequestMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [notificationResponse, jobsResponse] = await Promise.all([
        fetch("/api/employeeNotification", { cache: "no-store" }),
        fetch("/api/employeeJobs", { cache: "no-store" }),
      ]);

      if (!notificationResponse.ok || !jobsResponse.ok) {
        throw new Error("Unable to load notifications.");
      }

      const notificationData = await notificationResponse.json();
      const jobsData = await jobsResponse.json();

      setNotifications(notificationData.notifications ?? []);
      setJobs(jobsData.jobs ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateJob(assignmentId: string, action: string) {
    setSubmitting(assignmentId);
    setError("");

    try {
      const response = await fetch(
        `/api/employeeJobs/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Could not update job.");
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update job."
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function requestInstrument() {
    if (!selectedTask || !instrumentName.trim()) {
      setError("Select a job and enter an instrument name.");
      return;
    }

    setSubmitting("instrument");
    setError("");
    setRequestMessage("");

    try {
      const response = await fetch(
        "/api/instrument-requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: selectedTask,
            name: instrumentName,
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Could not submit instrument request."
        );
      }

      setRequestMessage("Instrument request submitted successfully.");
      setInstrumentName("");
      setQuantity("1");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit instrument request."
      );
    } finally {
      setSubmitting(null);
    }
  }

  const paymentNotifications = notifications.filter(
    (item) => item.type === "PAYMENT_SENT"
  );

  const jobNotifications = notifications.filter(
    (item) => item.type === "TASK_ASSIGNED"
  );

  const instrumentNotifications = notifications.filter(
    (item) => item.type === "INSTRUMENT_DECISION"
  );

  const pendingJobs = jobs.filter((job) => job.status === "PENDING");
  const activeJobs = jobs.filter((job) =>
    ["ACCEPTED", "IN_PROGRESS"].includes(job.status)
  );

  function formatDate(value: string) {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusBadge(status: string) {
    const variant =
      status === "COMPLETED"
        ? "default"
        : status === "REJECTED" || status === "CANCELLED"
          ? "destructive"
          : "secondary";

    return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Payments, job requests, and instrument requests.
          </p>
        </div>

        <Button variant="outline" onClick={() => void loadData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Job requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5" />
            Job requests
            <Badge variant="secondary">{pendingJobs.length}</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no pending job requests.
            </p>
          ) : (
            pendingJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {job.task?.name ?? "Cleaning job"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.task?.locationAddress ?? "No location provided"}
                  </p>
                  {job.task?.scheduledStart && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(job.task.scheduledStart)}
                    </p>
                  )}
                  {job.payoutAmount != null && (
                    <p className="text-sm font-medium">
                      Payout: ${Number(job.payoutAmount).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={submitting === job.id}
                    onClick={() => void updateJob(job.id, "ACCEPT")}
                  >
                    {submitting === job.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Accept
                  </Button>

                  <Button
                    variant="outline"
                    disabled={submitting === job.id}
                    onClick={() => void updateJob(job.id, "REJECT")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active jobs
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no active jobs.
            </p>
          ) : (
            activeJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <p className="font-medium">
                    {job.task?.name ?? "Cleaning job"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.task?.locationAddress ?? "No location provided"}
                  </p>
                  {statusBadge(job.status)}
                </div>

                {job.status === "ACCEPTED" && (
                  <Button
                    disabled={submitting === job.id}
                    onClick={() => void updateJob(job.id, "START")}
                  >
                    Start job
                  </Button>
                )}

                {job.status === "IN_PROGRESS" && (
                  <Button
                    disabled={submitting === job.id}
                    onClick={() => void updateJob(job.id, "COMPLETE")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark completed
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment notifications
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {paymentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment notifications yet.
            </p>
          ) : (
            paymentNotifications.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg border p-4">
                <CreditCard className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.body && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {!item.isRead && <Badge>New</Badge>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Instrument requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request instruments
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active job" />
                </SelectTrigger>
                <SelectContent>
                  {activeJobs.map((job) => (
                    <SelectItem key={job.taskId} value={job.taskId}>
                      {job.task?.name ?? "Cleaning job"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instrument name</Label>
              <Input
                value={instrumentName}
                onChange={(event) => setInstrumentName(event.target.value)}
                placeholder="e.g. Vacuum cleaner"
              />
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <Button
            disabled={submitting === "instrument"}
            onClick={() => void requestInstrument()}
          >
            {submitting === "instrument" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit instrument request
          </Button>

          {requestMessage && (
            <p className="text-sm text-green-600">{requestMessage}</p>
          )}
        </CardContent>
      </Card>

      {/* Instrument request decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrument request updates</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {instrumentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No instrument request updates yet.
            </p>
          ) : (
            instrumentNotifications.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg border p-4">
                <Bell className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.body && (
                    <p className="text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}