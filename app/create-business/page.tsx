"use client";

import { useState } from "react";
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
import { Building2, Tag, MapPin, Phone, Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

// Matches the Business model: name, category, address, phone
const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  category: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export default function BusinessInfoForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async () => {
    const result = businessSchema.safeParse({ name, category, address, phone });

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      setNameError(fieldErrors.name?.[0] ?? "");
      return;
    }
    setNameError("");

    setIsLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save business info");
      }

      toast.add({
        type: "success",
        title: "Business Saved",
        description: "Your business information has been saved successfully.",
      });
      router.push("/merchant");
    } catch (error: any) {
      toast.add({
        type: "error",
        title: "Save Failed",
        description:
          error?.message || "There was an error saving your business info.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-auto">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Tell us about your business so we can set up your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-2">
            Business name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="Green Leaf Gardening Co."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
            />
          </div>
          {nameError && <p className="text-sm text-red-500">{nameError}</p>}
        </div>

        <div>
          <Label htmlFor="category" className="mb-2">
            Category (optional)
          </Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="category"
              placeholder="Gardening"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="mb-2">
            Address (optional)
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
          <Label htmlFor="phone" className="mb-2">
            Phone (optional)
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
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Business Info
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
