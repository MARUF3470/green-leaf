// app/(merchant)/merchant/dashboard/page.tsx

import { Bell, Check, Hourglass, LineChart, User } from "lucide-react";

const stats = [
  {
    title: "Active Tasks",
    value: "4",
    note: "+1 today",
    noteClass: "text-blue-600 dark:text-blue-400",
    icon: Check,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Available Staff",
    value: "3/4",
    note: "1 unavailable",
    noteClass: "text-emerald-600 dark:text-emerald-400",
    icon: User,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Week Earnings",
    value: "$4,050",
    note: "+12% vs last week",
    noteClass: "text-blue-600 dark:text-blue-400",
    icon: LineChart,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Pending Approvals",
    value: "2",
    note: "1 instrument req",
    noteClass: "text-orange-600 dark:text-orange-400",
    icon: Hourglass,
    iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
];

const tasks = [
  {
    name: "Lawn Mowing - 820 Riverside Dr",
    person: "Sofia Arenas",
    time: "3 hours",
    status: "In Progress",
    amount: "$150",
    statusClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Hedge Trimming - Sunset Hill Estate",
    person: "Priya Nair",
    time: "2 hours",
    status: "In Progress",
    amount: "$120",
    statusClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Full Garden Service - Meadow Park",
    person: "James Okafor",
    time: "5 hours",
    status: "Pending",
    amount: "$260",
    statusClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    name: "Deep Clean - 2201 Congress Ave",
    person: "Carlos Mendez",
    time: "4 hours",
    status: "Completed",
    amount: "$195",
    statusClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

const activities = [
  {
    text: "Sofia Arenas accepted Task: Lawn Mowing - Riverside Dr",
    time: "10 min ago",
    active: true,
  },
  {
    text: "James Okafor added instrument: Irrigation repair kit ($42.00) - needs approval",
    time: "25 min ago",
    active: true,
  },
  {
    text: "Carlos Mendez changed status to Unavailable",
    time: "1 hour ago",
    active: false,
  },
  {
    text: "Task 'Barton Creek Irrigation' cancelled by employee",
    time: "2 hours ago",
    active: false,
  },
];

export default function MerchantDashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">
            Good morning, Marcus
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GreenLeaf Services · September 5, 2026
          </p>
        </div>

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

                <h2 className="mt-5 text-2xl font-bold">{item.value}</h2>

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

              <button className="text-xs font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                View all
              </button>
            </div>

            <div>
              {tasks.map((task) => (
                <div
                  key={task.name}
                  className="grid gap-4 border-b border-border px-6 py-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{task.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.person} · {task.time}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${task.statusClass}`}
                  >
                    {task.status}
                  </span>

                  <p className="text-sm font-bold">{task.amount}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-bold">Activity</h2>
            </div>

            <div className="space-y-5 px-6 py-5">
              {activities.map((activity) => (
                <div key={activity.text} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      activity.active ? "bg-blue-500" : "bg-muted-foreground/25"
                    }`}
                  />

                  <div>
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
          </aside>
        </div>
      </section>
    </main>
  );
}
