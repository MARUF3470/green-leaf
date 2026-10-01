"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Trash2,
  Users,
  Wallet,
  Package,
  Loader2,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "@/components/ui/toast";
import { getAllEmployees } from "@/app/server/employee";
import { useRouter } from "next/navigation";

const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  description: z.string().optional(),
  locationAddress: z.string().trim().min(1, "Location is required"),
  scheduledStart: z.string().optional(),
  durationMinutes: z.coerce
    .number()
    .int()
    .positive("Duration must be greater than zero"),
  price: z.coerce.number().nonnegative("Price cannot be negative"),
  status: z.enum(["DRAFT", "OPEN"]),
  assignments: z.array(
    z.object({
      employeeId: z.string().min(1),
      payoutAmount: z.number().nonnegative(),
    }),
  ),
  instruments: z.array(
    z.object({
      name: z.string().trim().min(1),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative().optional(),
    }),
  ),
});

type Employee = {
  id: string;
  username: string;
  email: string;
  profile?: {
    fullName?: string | null;
  } | null;
};

type AssignmentForm = {
  employeeId: string;
  payoutAmount: string;
};

type InstrumentForm = {
  name: string;
  quantity: string;
  price: string;
};

export default function AddTaskPage() {
  const { data: session, status: sessionStatus } = useSession();
  console.log(session, "session");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [price, setPrice] = useState("");
  const [taskStatus, setTaskStatus] = useState<"DRAFT" | "OPEN">("OPEN");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentForm[]>([]);
  const [instruments, setInstruments] = useState<InstrumentForm[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    let cancelled = false;

    async function loadEmployees() {
      try {
        // Expected response: { employees: Employee[] }
        const employees = await getAllEmployees();
        console.log(employees);
        if (employees.length) {
          setEmployees(employees);
        }
      } catch (error) {
        if (!cancelled) {
          toast.add({
            type: "error",
            title: "Unable to load employees",
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
        }
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  const selectedEmployeeIds = assignments.map(
    (assignment) => assignment.employeeId,
  );

  const addAssignment = (employeeId: string) => {
    if (!employeeId || selectedEmployeeIds.includes(employeeId)) {
      return;
    }

    setAssignments((current) => [...current, { employeeId, payoutAmount: "" }]);
  };

  const updateAssignment = (employeeId: string, payoutAmount: string) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.employeeId === employeeId
          ? { ...assignment, payoutAmount }
          : assignment,
      ),
    );
  };

  const removeAssignment = (employeeId: string) => {
    setAssignments((current) =>
      current.filter((assignment) => assignment.employeeId !== employeeId),
    );
  };

  const addInstrument = () => {
    setInstruments((current) => [
      ...current,
      { name: "", quantity: "1", price: "" },
    ]);
  };

  const updateInstrument = (
    index: number,
    field: keyof InstrumentForm,
    value: string,
  ) => {
    setInstruments((current) =>
      current.map((instrument, i) =>
        i === index ? { ...instrument, [field]: value } : instrument,
      ),
    );
  };

  const removeInstrument = (index: number) => {
    setInstruments((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const parsed = taskSchema.safeParse({
      name,
      description,
      locationAddress,
      scheduledStart,
      durationMinutes,
      price,
      status: taskStatus,
      assignments: assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        payoutAmount: Number(assignment.payoutAmount),
      })),
      instruments: instruments.map((instrument) => ({
        name: instrument.name,
        quantity: Number(instrument.quantity),
        ...(instrument.price !== "" ? { price: Number(instrument.price) } : {}),
      })),
    });

    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;

      setErrors({
        name: fieldErrors.name?.[0] ?? "",
        locationAddress: fieldErrors.locationAddress?.[0] ?? "",
        durationMinutes: fieldErrors.durationMinutes?.[0] ?? "",
        price: fieldErrors.price?.[0] ?? "",
      });

      const assignmentError = assignments.some(
        (assignment) =>
          assignment.payoutAmount.trim() === "" ||
          !Number.isFinite(Number(assignment.payoutAmount)) ||
          Number(assignment.payoutAmount) < 0,
      );

      if (assignmentError) {
        setErrors((current) => ({
          ...current,
          assignments: "Enter a valid payout for every employee.",
        }));
      }

      const instrumentError = instruments.some(
        (instrument) =>
          !instrument.name.trim() ||
          !Number.isInteger(Number(instrument.quantity)) ||
          Number(instrument.quantity) <= 0 ||
          (instrument.price !== "" &&
            (!Number.isFinite(Number(instrument.price)) ||
              Number(instrument.price) < 0)),
      );

      if (instrumentError) {
        setErrors((current) => ({
          ...current,
          instruments: "Check your instrument details.",
        }));
      }

      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...parsed.data,
          scheduledStart: scheduledStart
            ? new Date(scheduledStart).toISOString()
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      toast.add({
        type: "success",
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      router.push("/merchant/tasks");
    } catch (error) {
      toast.add({
        type: "error",
        title: "Could not create task",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session || session.user.role !== "OWNER") {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Only business owners can create tasks.
      </div>
    );
  }

  const selectedEmployees = assignments.map((assignment) => ({
    ...assignment,
    employee: employees.find(
      (employee) => employee.id === assignment.employeeId,
    ),
  }));

  const totalPayout = assignments.reduce(
    (total, assignment) => total + (Number(assignment.payoutAmount) || 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-3 -ml-3 text-muted-foreground"
            onClick={() => router.push("/merchant/tasks")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tasks
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">Create a task</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Set up the job, assign your team, and configure the finances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs font-medium">
            {taskStatus === "DRAFT" ? "Draft" : "Open task"}
          </span>
        </div>
      </div>

      {/* Task details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Task details
          </CardTitle>
          <CardDescription>
            Provide the basic information about this job.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="taskName">Task name *</Label>
            <Input
              id="taskName"
              placeholder="Office cleaning"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the work that needs to be completed..."
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Job location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                className="pl-9"
                placeholder="Street address, suburb, postcode"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
              />
            </div>
            {errors.locationAddress && (
              <p className="text-sm text-destructive">
                {errors.locationAddress}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Scheduled start</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  className="pl-9"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  className="pl-9"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
              {errors.durationMinutes && (
                <p className="text-sm text-destructive">
                  {errors.durationMinutes}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign employees
          </CardTitle>
          <CardDescription>
            Choose team members and set their individual payouts.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="employeeSelect">Add an employee</Label>

            <select
              id="employeeSelect"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value=""
              disabled={loadingEmployees}
              onChange={(e) => addAssignment(e.target.value)}
            >
              <option value="">
                {loadingEmployees
                  ? "Loading employees..."
                  : "Select an employee"}
              </option>

              {employees
                .filter(
                  (employee) => !selectedEmployeeIds.includes(employee.id),
                )
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.profile?.fullName || employee.username} (
                    {employee.email})
                  </option>
                ))}
            </select>
          </div>

          {selectedEmployees.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No employees assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can assign employees now or create the task without
                assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEmployees.map((assignment) => (
                <div
                  key={assignment.employeeId}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {assignment.employee?.profile?.fullName ||
                        assignment.employee?.username ||
                        "Employee"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {assignment.employee?.email}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-muted px-2 py-1 text-xs">
                      Pending invitation
                    </span>
                  </div>

                  <div className="w-full space-y-2 sm:w-40">
                    <Label>Payout amount *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={assignment.payoutAmount}
                      onChange={(e) =>
                        updateAssignment(assignment.employeeId, e.target.value)
                      }
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove employee"
                    onClick={() => removeAssignment(assignment.employeeId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {errors.assignments && (
                <p className="text-sm text-destructive">{errors.assignments}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Task finances
          </CardTitle>
          <CardDescription>
            These financial details are for the business owner.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="price">Client price *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
          </div>

          <div className="grid gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Client price</p>
              <p className="mt-1 text-xl font-semibold">
                {Number(price || 0).toLocaleString(undefined, {
                  style: "currency",
                  currency: "AUD",
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Total employee payouts
              </p>
              <p className="mt-1 text-xl font-semibold">
                {totalPayout.toLocaleString(undefined, {
                  style: "currency",
                  currency: "AUD",
                })}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This is a preliminary difference between client price and employee
            payouts. Instrument costs and other expenses are not included.
          </p>
        </CardContent>
      </Card>

      {/* Instruments */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Instruments and supplies
              </CardTitle>
              <CardDescription className="mt-2">
                Add equipment or supplies required for the job.
              </CardDescription>
            </div>

            <Button type="button" variant="outline" onClick={addInstrument}>
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {instruments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No instruments added.
            </div>
          ) : (
            instruments.map((instrument, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_100px_140px_40px]"
              >
                <div className="space-y-2">
                  <Label>Instrument name *</Label>
                  <Input
                    placeholder="Cleaning solution"
                    value={instrument.name}
                    onChange={(e) =>
                      updateInstrument(index, "name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={instrument.quantity}
                    onChange={(e) =>
                      updateInstrument(index, "quantity", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={instrument.price}
                    onChange={(e) =>
                      updateInstrument(index, "price", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove instrument"
                    onClick={() => removeInstrument(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {errors.instruments && (
            <p className="text-sm text-destructive">{errors.instruments}</p>
          )}
        </CardContent>
      </Card>

      {/* Submission */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Ready to create this task?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {taskStatus === "DRAFT"
                ? "The task will be saved as a draft."
                : "The task will be open for your team."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setTaskStatus("DRAFT")}
            >
              Save as draft
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setTaskStatus("OPEN");
                void handleSubmit();
              }}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create task
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
