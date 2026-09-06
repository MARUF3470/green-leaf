// app/(admin)/admin/revenue/page.tsx

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    label: "Total MRR",
    value: "$2,480",
    note: "+13% vs last month",
    noteClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Active Businesses",
    value: "3",
    note: "",
    noteClass: "",
  },
  {
    label: "Suspended",
    value: "1",
    note: "",
    valueClass: "text-red-500",
    noteClass: "",
  },
];

const revenueData = [
  { month: "Apr", mrr: 1080 },
  { month: "May", mrr: 1340 },
  { month: "Jun", mrr: 1560 },
  { month: "Jul", mrr: 1860 },
  { month: "Aug", mrr: 2200 },
  { month: "Sep", mrr: 2480 },
];

export default function AdminRevenuePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <h1 className="text-2xl font-bold tracking-normal">Platform Revenue</h1>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-7">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                {stat.label}
              </p>

              <h2
                className={`mt-2 text-3xl font-bold ${stat.valueClass ?? ""}`}
              >
                {stat.value}
              </h2>

              {stat.note ? (
                <p className={`mt-2 text-sm font-semibold ${stat.noteClass}`}>
                  {stat.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle>MRR Growth</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) => `$${value}`}
                />

                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                  formatter={(value) => [`$${value}`, "MRR"]}
                />

                <Bar
                  dataKey="mrr"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                  barSize={100}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
