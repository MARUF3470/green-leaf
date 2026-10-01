"use client";
import { useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// const stats = [
//   {
//     label: "Total Revenue",
//     value: "$18,240",
//     note: "This month",
//     noteClass: "text-emerald-600 dark:text-emerald-400",
//   },
//   {
//     label: "Total Costs",
//     value: "$10,320",
//     note: "Labor + equipment",
//     noteClass: "text-red-600 dark:text-red-400",
//   },
//   {
//     label: "Net Profit",
//     value: "$7,920",
//     note: "43.4% margin",
//     noteClass: "text-emerald-600 dark:text-emerald-400",
//   },
//   {
//     label: "Tasks Done",
//     value: "47",
//     note: "This month",
//     noteClass: "text-emerald-600 dark:text-emerald-400",
//   },
// ];

// const weeklyData = [
//   { day: "Mon", costs: 250, earnings: 520 },
//   { day: "Tue", costs: 210, earnings: 380 },
//   { day: "Wed", costs: 390, earnings: 690 },
//   { day: "Thu", costs: 260, earnings: 460 },
//   { day: "Fri", costs: 430, earnings: 780 },
//   { day: "Sat", costs: 520, earnings: 930 },
//   { day: "Sun", costs: 180, earnings: 310 },
// ];

// const costBreakdown = [
//   { name: "Labor", value: 58, color: "#2563eb" },
//   { name: "Equipment", value: 22, color: "#059669" },
//   { name: "Materials", value: 13, color: "#f59e0b" },
//   { name: "Other", value: 7, color: "#94a3b8" },
// ];

// const profitTrend = [
//   { month: "Apr", profit: 1700 },
//   { month: "May", profit: 1950 },
//   { month: "Jun", profit: 1800 },
//   { month: "Jul", profit: 2150 },
//   { month: "Aug", profit: 2300 },
//   { month: "Sep", profit: 2100 },
// ];

type AnalyticsData = {
  stats: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    tasksDone: number;
  };
  weeklyData: {
    day: string;
    costs: number;
    earnings: number;
  }[];
  costBreakdown: {
    name: string;
    value: number;
  }[];
  profitTrend: {
    month: string;
    profit: number;
  }[];
};

const costColors: Record<string, string> = {
  Labor: "#2563eb",
  Equipment: "#059669",
  Materials: "#f59e0b",
  Other: "#94a3b8",
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export default function MerchantAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/analytics", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load analytics.");
        }

        setAnalytics(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAnalytics();
  }, []);

  const stats = analytics
    ? [
        {
          label: "Total Revenue",
          value: currency(analytics.stats.totalRevenue),
          note: "Completed tasks this month",
          noteClass: "text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "Total Costs",
          value: currency(analytics.stats.totalCosts),
          note: "Labor + equipment + expenses",
          noteClass: "text-red-600 dark:text-red-400",
        },
        {
          label: "Net Profit",
          value: currency(analytics.stats.netProfit),
          note: `${analytics.stats.profitMargin}% margin`,
          noteClass:
            analytics.stats.netProfit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
        },
        {
          label: "Tasks Done",
          value: String(analytics.stats.tasksDone),
          note: "Completed this month",
          noteClass: "text-emerald-600 dark:text-emerald-400",
        },
      ]
    : [];

  const weeklyData = analytics?.weeklyData ?? [];

  const costBreakdown = (analytics?.costBreakdown ?? []).map((item) => ({
    ...item,
    color: costColors[item.name] ?? "#94a3b8",
  }));

  const profitTrend = analytics?.profitTrend ?? [];

  return (
    <>
      {isLoading && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading analytics...
        </p>
      )}

      {error && (
        <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && analytics && (
        <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              September 2026 — GreenLeaf Services
            </p>
          </div>

          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {stat.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{stat.value}</h2>
                  <p className={`mt-1 text-xs font-semibold ${stat.noteClass}`}>
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Earnings vs. Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
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
                      />
                      <Bar
                        dataKey="costs"
                        fill="#93c5fd"
                        radius={[6, 6, 0, 0]}
                        name="Costs"
                      />
                      <Bar
                        dataKey="earnings"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                        name="Earnings"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={76}
                        paddingAngle={2}
                      >
                        {costBreakdown.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {costBreakdown.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle>Profit Trend — Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
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
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      )}
    </>
  );
}
