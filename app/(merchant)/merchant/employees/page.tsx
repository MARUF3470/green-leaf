import { MapPin, Plus, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const employees = [
  {
    name: "Sofia Arenas",
    email: "sofia@greenleaf.io",
    task: "Lawn mowing - Riverside Dr",
    completed: 34,
    rating: 4.8,
    status: "Available",
    statusColor: "available",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Carlos Mendez",
    email: "carlos@greenleaf.io",
    task: "No active task",
    completed: 22,
    rating: 4.5,
    status: "Unavailable",
    statusColor: "unavailable",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Priya Nair",
    email: "priya@greenleaf.io",
    task: "Hedge trimming - Sunset Hill",
    completed: 18,
    rating: 4.9,
    status: "Available",
    statusColor: "available",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "James Okafor",
    email: "james@greenleaf.io",
    task: "Irrigation check - Meadow Park",
    completed: 29,
    rating: 4.7,
    status: "Available",
    statusColor: "available",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
  },
];

function getStatusClass(statusColor: string) {
  if (statusColor === "available") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }

  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function getDotClass(statusColor: string) {
  if (statusColor === "available") {
    return "bg-emerald-500";
  }

  return "bg-red-500";
}

export default function MerchantEmployeesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">4 team members</p>
        </div>

        <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      <section className="mt-7 grid gap-5 xl:grid-cols-2">
        {employees.map((employee) => (
          <Card key={employee.email} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <Avatar className="size-16">
                    <AvatarImage src={employee.image} alt={employee.name} />
                    <AvatarFallback>
                      {employee.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="font-bold">{employee.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {employee.email}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} className="text-pink-500" />
                      <span>{employee.task}</span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`gap-1.5 rounded-full ${getStatusClass(
                    employee.statusColor,
                  )}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${getDotClass(
                      employee.statusColor,
                    )}`}
                  />
                  {employee.status}
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tasks completed
                  </p>
                  <p className="mt-1 font-bold">{employee.completed}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Star
                      size={16}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <p className="font-bold">{employee.rating}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
