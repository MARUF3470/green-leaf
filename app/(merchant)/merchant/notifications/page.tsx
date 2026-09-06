// app/(merchant)/merchant/notifications/page.tsx

import { Check, Circle, RefreshCw, Wrench, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const notifications = [
  {
    icon: Check,
    iconClass: "bg-emerald-500 text-white",
    title: "Sofia Arenas accepted Task: Lawn Mowing - Riverside Dr",
    time: "10 min ago",
    unread: true,
  },
  {
    icon: Wrench,
    iconClass: "text-violet-300",
    title:
      "James Okafor added instrument: Irrigation repair kit ($42.00) - needs approval",
    time: "25 min ago",
    unread: true,
  },
  {
    icon: RefreshCw,
    iconClass: "bg-blue-500 text-white",
    title: "Carlos Mendez changed status to Unavailable",
    time: "1 hour ago",
    unread: false,
  },
  {
    icon: X,
    iconClass: "text-rose-500",
    title: "Task 'Barton Creek Irrigation' cancelled by employee",
    time: "2 hours ago",
    unread: false,
  },
  {
    icon: Check,
    iconClass: "bg-emerald-500 text-white",
    title: "Priya Nair accepted Task: Hedge Trimming - Sunset Hill",
    time: "3 hours ago",
    unread: false,
  },
];

export default function MerchantNotificationsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Notifications</h1>
          <p className="mt-1 text-lg text-muted-foreground">2 unread</p>
        </div>

        <Button
          variant="link"
          className="px-0 text-blue-600 dark:text-blue-400"
        >
          Mark all as read
        </Button>
      </div>

      <Card className="mt-7 overflow-hidden p-0 shadow-sm">
        <CardContent className="p-0">
          {notifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <div
                key={notification.title}
                className="flex items-center gap-5 border-b border-border px-7 py-5 last:border-b-0"
              >
                <div
                  className={`grid size-5 shrink-0 place-items-center rounded-sm ${notification.iconClass}`}
                >
                  <Icon size={16} strokeWidth={3} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium leading-6 text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.time}
                  </p>
                </div>

                {notification.unread ? (
                  <Circle
                    size={10}
                    className="shrink-0 fill-blue-500 text-blue-500"
                  />
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-sm">
        <CardContent className="p-7">
          <h2 className="text-lg font-bold">Pending Approvals</h2>

          <div className="mt-5 rounded-xl border border-yellow-400 bg-yellow-400/10 p-6">
            <div className="flex gap-5">
              <Wrench className="mt-1 shrink-0 text-violet-300" size={22} />

              <div>
                <h3 className="text-base font-semibold">
                  New instrument request
                </h3>

                <p className="mt-1 text-base text-foreground">
                  James Okafor added "Irrigation repair kit" — $42.00
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Task: Full Garden Service - Meadow Park
                </p>

                <div className="mt-4 flex gap-3">
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    className="border-red-400 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
