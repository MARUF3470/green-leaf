"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type EmployeeProfile = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  contactEmail: string;
  address: string;
  photoUrl: string;
  isAvailable: boolean;
};

const emptyProfile: EmployeeProfile = {
  id: "",
  username: "",
  email: "",
  fullName: "",
  phone: "",
  contactEmail: "",
  address: "",
  photoUrl: "",
  isAvailable: true,
};

export default function EmployeeProfilePage() {
  const [profile, setProfile] =
    useState<EmployeeProfile>(emptyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/employeeProfile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load profile");
      }

      setProfile({
        ...emptyProfile,
        ...data,
      });
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
    fetchProfile();
  }, [fetchProfile]);

  function updateField<K extends keyof EmployeeProfile>(
    field: K,
    value: EmployeeProfile[K],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/employeeProfile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          contactEmail: profile.contactEmail,
          address: profile.address,
          photoUrl: profile.photoUrl,
          isAvailable: profile.isAvailable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile");
      }

      setProfile({
        ...emptyProfile,
        ...data.profile,
      });

      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and update your personal information.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"
          >
            <Check size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>
                Update your profile details below.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20">
                  <AvatarImage
                    src={profile.photoUrl || undefined}
                    alt={profile.fullName || "Profile photo"}
                  />
                  <AvatarFallback>
                    <UserRound className="size-8" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {profile.fullName || "Your name"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-2"
                  >
                    Employee
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Login email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your login email cannot be changed here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Contact email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profile.contactEmail}
                    onChange={(event) =>
                      updateField("contactEmail", event.target.value)
                    }
                    placeholder="Enter your contact email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Profile photo URL</Label>
                  <Input
                    id="photoUrl"
                    type="url"
                    value={profile.photoUrl}
                    onChange={(event) =>
                      updateField("photoUrl", event.target.value)
                    }
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="Enter your residential address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Let your business know whether you are available
                for new tasks.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Available for tasks
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.isAvailable
                      ? "You are currently marked as available."
                      : "You are currently marked as unavailable."}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={profile.isAvailable}
                  onChange={(event) =>
                    updateField("isAvailable", event.target.checked)
                  }
                  className="size-4 accent-primary"
                />
              </label>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="min-w-36 gap-2"
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}

              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}