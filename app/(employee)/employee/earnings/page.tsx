// app/(employee)/employee/earnings/page.tsx

import { Hourglass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const payments = [
  {
    task: "Lawn Mowing - 820 Riverside Dr",
    date: "2026-09-03",
    duration: "3 hours",
    amount: "$85",
    status: "Transfer Pending",
  },
  {
    task: "Pressure Wash - Cedar Blvd Driveway",
    date: "2026-09-05",
    duration: "2 hours",
    amount: "$70",
    status: "Transfer Pending",
  },
];

export default function EmployeeEarningsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <h1 className="text-2xl font-bold tracking-normal">My Earnings</h1>

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        <Card className="border-emerald-600 bg-emerald-600 text-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/85">Total Earned</p>
            <h2 className="mt-2 text-4xl font-bold">$0</h2>
            <p className="mt-2 text-sm text-white/85">From completed tasks</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <h2 className="mt-2 text-4xl font-bold text-orange-500">$155</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-7 overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {payments.map((payment) => (
            <div
              key={payment.task}
              className="flex items-center gap-5 border-t border-border px-6 py-5"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-yellow-500/10 text-yellow-600">
                <Hourglass size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{payment.task}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {payment.date} · {payment.duration}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <p className="text-xl font-bold">{payment.amount}</p>
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400"
                >
                  <span className="size-1.5 rounded-full bg-orange-500" />
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
