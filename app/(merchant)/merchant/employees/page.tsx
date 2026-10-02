"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Employee = {
  id: string;
  name: string;
  email: string;
  task: string;
  completed: number;
  status: "Available" | "Unavailable";
  statusColor: "available" | "unavailable";
};

function getStatusClass(statusColor: Employee["statusColor"]) {
  if (statusColor === "available") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }

  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function getDotClass(statusColor: Employee["statusColor"]) {
  return statusColor === "available"
    ? "bg-emerald-500"
    : "bg-red-500";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MerchantEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingEmployeeId, setDeletingEmployeeId] =
    useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/merchant/employees");

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data: Employee[] = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleRemoveEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${employee.name}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingEmployeeId(employee.id);
      setError("");

      const response = await fetch("/api/merchant/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove employee",
        );
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove employee",
      );
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">
            Employees
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} team{" "}
            {employees.length === 1 ? "member" : "members"}
          </p>
        </div>

        <Link href="/merchant/add-employee">
          <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Plus size={16} />
            Add Employee
          </Button>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <Card className="mt-7">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Users className="mb-3 size-10 text-muted-foreground" />

            <h2 className="font-semibold">No employees yet</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add an employee to start building your team.
            </p>

            <Link href="/merchant/add-employee" className="mt-5">
              <Button>
                <Plus size={16} className="mr-2" />
                Add Employee
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <section className="mt-7 grid gap-5 xl:grid-cols-2">
          {employees.map((employee) => (
            <Card key={employee.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <Avatar className="size-16 shrink-0">
                      <AvatarFallback className="font-semibold">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <h2 className="font-bold">
                        {employee.name}
                      </h2>

                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {employee.email}
                      </p>

                      <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0 text-pink-500"
                        />

                        <span>{employee.task}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`shrink-0 gap-1.5 rounded-full ${getStatusClass(
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

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tasks completed
                    </p>

                    <p className="mt-1 font-bold">
                      {employee.completed}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                    disabled={
                      deletingEmployeeId === employee.id
                    }
                    onClick={() =>
                      handleRemoveEmployee(employee)
                    }
                  >
                    <Trash2 size={15} />

                    {deletingEmployeeId === employee.id
                      ? "Removing..."
                      : "Remove"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}