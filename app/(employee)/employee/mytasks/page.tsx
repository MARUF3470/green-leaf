// app/(employee)/employee/tasks/page.tsx

import { Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const tasks = [
  {
    title: "Lawn Mowing - 820 Riverside Dr",
    address: "820 Riverside Dr, Austin, TX",
    duration: "3 hours",
    earnings: "$85",
    status: "In Progress",
    statusClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  {
    title: "Pressure Wash - Cedar Blvd Driveway",
    address: "220 Cedar Blvd, Austin, TX",
    duration: "2 hours",
    earnings: "$70",
    status: "Accepted",
    statusClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
];

export default function EmployeeTasksPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-lg font-bold tracking-normal">
              Availability Status
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You're visible for new tasks
            </p>
          </div>

          <Switch defaultChecked />
        </CardContent>
      </Card>

      <section className="mt-8">
        <div>
          <h2 className="text-2xl font-bold tracking-normal">My Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">2 assigned</p>
        </div>

        <div className="mt-6 space-y-4">
          {tasks.map((task) => (
            <Card key={task.title} className="shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold">{task.title}</h3>

                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={15} className="text-pink-500" />
                    <span>{task.address}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={15} />
                    <span>{task.duration}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {task.earnings}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      your earnings
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`gap-1.5 rounded-full ${task.statusClass}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${task.dotClass}`}
                    />
                    {task.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
