"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  Lock,
  Loader2,
  UserPlus,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

// Matches: User (name, password) + EmployeeProfile (fullName, phone, email, address)
const employeeSchema = z.object({
  name: z
    .string()
    .min(3, "name must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, _ . - allowed"),

  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),

  phone: z.string().optional(),

  address: z.string().optional(),

  password: z
    .string()
    .min(8, "Temporary password must be at least 8 characters"),

  role: z.literal("EMPLOYEE"),

  whoAdded: z.string().min(1, "Owner ID is required"),

  businessId: z.string().min(1, "Business ID is required"),
});

export default function AddEmployeeForm() {
  const { data: session, status } = useSession();

  const [name, setname] = useState("");
  const [email, setemail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const generatePassword = () => {
    const random = Math.random().toString(36).slice(-8);
    setPassword(random);
  };

  const handleSubmit = async () => {
    console.log("hitting");
    const result = employeeSchema.safeParse({
      name,
      email,
      phone,
      address,
      password,
      role: "EMPLOYEE",
      whoAdded: session?.user?.id,
      businessId: session?.user?.businessId,
    });

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0] ?? "",
        email: fieldErrors.email?.[0] ?? "",
        password: fieldErrors.password?.[0] ?? "",
      });
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add employee");
      }

      toast.add({
        type: "success",
        title: "Employee Added",
        description: `${name} can now log in with email "${email}".`,
      });

      // Reset form

      setname("");
      setemail("");
      setPhone("");
      setAddress("");
      setPassword("");
    } catch (error: any) {
      toast.add({
        type: "error",
        title: "Failed to Add Employee",
        description: error?.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Checking your session...
        </CardContent>
      </Card>
    );
  }

  if (!session || session.user.role !== "OWNER") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Only business owners can add employees.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Employee</CardTitle>
        <CardDescription>
          Create login credentials for a new employee.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-2">
            name
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="jane.smith"
              value={name}
              onChange={(e) => setname(e.target.value)}
              className="pl-10"
            />
          </div>
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="mb-2">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setemail(e.target.value)}
              className="pl-10"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="mb-2">
            Phone
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              placeholder="+8801XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="mb-2">
            Address
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="address"
              placeholder="House #, Street, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="mb-2">
            Temporary password
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="text"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="button" variant="outline" onClick={generatePassword}>
              Generate
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Share this with the employee — they'll be asked to change it on
            first login.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
