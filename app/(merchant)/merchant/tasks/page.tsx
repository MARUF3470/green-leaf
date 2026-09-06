// app/(merchant)/merchant/tasks/page.tsx

import { Plus } from "lucide-react";

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
];

const tasks = [
  {
    task: "Lawn Mowing - 820 Riverside Dr",
    address: "820 Riverside Dr, Austin, TX",
    employee: "Sofia Arenas",
    duration: "3 hours",
    status: "In Progress",
    price: "$150",
    color: "blue",
  },
  {
    task: "Hedge Trimming - Sunset Hill Estate",
    address: "14 Sunset Hill Rd, Austin, TX",
    employee: "Priya Nair",
    duration: "2 hours",
    status: "In Progress",
    price: "$120",
    color: "blue",
  },
  {
    task: "Full Garden Service - Meadow Park",
    address: "Meadow Park Community, Austin, TX",
    employee: "James Okafor",
    duration: "5 hours",
    status: "Pending",
    price: "$260",
    color: "orange",
  },
  {
    task: "Deep Clean - 2201 Congress Ave",
    address: "2201 Congress Ave, Austin, TX",
    employee: "Carlos Mendez",
    duration: "4 hours",
    status: "Completed",
    price: "$195",
    color: "green",
  },
  {
    task: "Pressure Wash - Cedar Blvd Driveway",
    address: "220 Cedar Blvd, Austin, TX",
    employee: "Sofia Arenas",
    duration: "2 hours",
    status: "Accepted",
    price: "$130",
    color: "blue",
  },
  {
    task: "Irrigation System Check - Barton Creek",
    address: "Barton Creek Blvd, Austin, TX",
    employee: "James Okafor",
    duration: "1.5 hours",
    status: "Cancelled",
    price: "$90",
    color: "muted",
  },
];

function getStatusClass(color: string) {
  switch (color) {
    case "blue":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "orange":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "green":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getDotClass(color: string) {
  switch (color) {
    case "blue":
      return "bg-blue-500";
    case "orange":
      return "bg-orange-500";
    case "green":
      return "bg-emerald-500";
    default:
      return "bg-muted-foreground/50";
  }
}

export default function MerchantTasksPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">6 total tasks</p>
        </div>

        <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus size={16} />
          New Task
        </Button>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={filter === "All" ? "default" : "outline"}
            className={
              filter === "All"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-card"
            }
          >
            {filter}
          </Button>
        ))}
      </div>

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
              </TableRow>
            </TableHeader>

            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task}>
                  <TableCell className="py-5">
                    <div>
                      <p className="font-semibold text-foreground">
                        {task.task}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.address}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {task.employee}
                  </TableCell>

                  <TableCell>{task.duration}</TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`gap-1.5 rounded-full ${getStatusClass(task.color)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${getDotClass(task.color)}`}
                      />
                      {task.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right font-bold">
                    {task.price}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
