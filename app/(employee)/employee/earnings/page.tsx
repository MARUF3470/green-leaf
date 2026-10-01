"use client";

import { useCallback, useEffect, useState } from "react";
import { Hourglass, Wallet, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Payment = {
  id: string;
  task: string;
  address: string;
  date: string | null;
  durationMinutes: number;
  amount: number;
  assignmentStatus: string;
  payoutStatus: string;
  isCompleted: boolean;
  isPaid: boolean;
  status: string;
};

type EarningsData = {
  totalEarned: number;
  pending: number;
  payments: Payment[];
};

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  switch (status) {
    case "Paid":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";

    case "Transfer Pending":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function EmployeeEarningsPage() {
  const [data, setData] = useState<EarningsData>({
    totalEarned: 0,
    pending: 0,
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEarnings = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/employeeEarnings", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch earnings.",
        );
      }

      setData({
        totalEarned: Number(result.totalEarned ?? 0),
        pending: Number(result.pending ?? 0),
        payments: Array.isArray(result.payments)
          ? result.payments
          : [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading earnings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEarnings();
  }, [fetchEarnings]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">
            My Earnings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your completed tasks and payments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            void fetchEarnings();
          }}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        <Card className="border-emerald-600 bg-emerald-600 text-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">
                Total Earned
              </p>
              <Wallet className="size-5 text-white/80" />
            </div>

            <h2 className="mt-2 text-4xl font-bold">
              {loading ? "—" : formatCurrency(data.totalEarned)}
            </h2>

            <p className="mt-2 text-sm text-white/85">
              From completed tasks
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Transfers
            </p>

            <h2 className="mt-2 text-4xl font-bold text-orange-500">
              {loading ? "—" : formatCurrency(data.pending)}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Completed tasks awaiting payment
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-7 overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Loading your earnings...
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setLoading(true);
                  void fetchEarnings();
                }}
              >
                Try again
              </Button>
            </div>
          ) : data.payments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
                <Wallet className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-semibold">
                No payment history yet
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Your task earnings will appear here.
              </p>
            </div>
          ) : (
            data.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-4 border-t border-border px-4 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-yellow-500/10 text-yellow-600">
                  <Hourglass size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    {payment.task}
                  </h2>

                  {payment.address && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {payment.address}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(payment.date)} ·{" "}
                    {formatDuration(payment.durationMinutes)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-xl font-bold">
                    {formatCurrency(payment.amount)}
                  </p>

                  <Badge
                    variant="secondary"
                    className={`gap-1.5 rounded-full ${getStatusStyles(
                      payment.status,
                    )}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        payment.status === "Paid"
                          ? "bg-emerald-500"
                          : payment.status === "Transfer Pending"
                            ? "bg-orange-500"
                            : "bg-muted-foreground"
                      }`}
                    />
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}