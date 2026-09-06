// app/(merchant)/merchant/analytics/page.tsx

"use client";

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

const stats = [
  {
    label: "Total Revenue",
    value: "$18,240",
    note: "This month",
    noteClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Total Costs",
    value: "$10,320",
    note: "Labor + equipment",
    noteClass: "text-red-600 dark:text-red-400",
  },
  {
    label: "Net Profit",
    value: "$7,920",
    note: "43.4% margin",
    noteClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Tasks Done",
    value: "47",
    note: "This month",
    noteClass: "text-emerald-600 dark:text-emerald-400",
  },
];

const weeklyData = [
  { day: "Mon", costs: 250, earnings: 520 },
  { day: "Tue", costs: 210, earnings: 380 },
  { day: "Wed", costs: 390, earnings: 690 },
  { day: "Thu", costs: 260, earnings: 460 },
  { day: "Fri", costs: 430, earnings: 780 },
  { day: "Sat", costs: 520, earnings: 930 },
  { day: "Sun", costs: 180, earnings: 310 },
];

const costBreakdown = [
  { name: "Labor", value: 58, color: "#2563eb" },
  { name: "Equipment", value: 22, color: "#059669" },
  { name: "Materials", value: 13, color: "#f59e0b" },
  { name: "Other", value: 7, color: "#94a3b8" },
];

const profitTrend = [
  { month: "Apr", profit: 1700 },
  { month: "May", profit: 1950 },
  { month: "Jun", profit: 1800 },
  { month: "Jul", profit: 2150 },
  { month: "Aug", profit: 2300 },
  { month: "Sep", profit: 2100 },
];

export default function MerchantAnalyticsPage() {
  return (
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
                    <span className="text-muted-foreground">{item.name}</span>
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
  );
}
