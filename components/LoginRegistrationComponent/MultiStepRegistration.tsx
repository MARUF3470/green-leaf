"use client";

import { useState } from "react";
import { set, z } from "zod";
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
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  LogIn,
  User as UserIcon,
  Phone,
  MapPin,
  UploadCloud,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import Image from "next/image";

const emailSchema = z
  .string()
  .email({ message: "Please enter a valid email address" });

export default function MultiStepRegistration({
  setHaveAccount,
}: {
  setHaveAccount: (value: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<string>("forward");

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStepOneSubmit = () => {
    let hasError = false;
    if (!name.trim()) {
      setNameError("Please enter your name");
      hasError = true;
    } else {
      setNameError("");
    }

    try {
      emailSchema.parse(email);
      setEmailError("");
    } catch {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (hasError) return;
    setDirection("forward");
    setStep(2);
  };

  const handleStepTwoSubmit = () => {
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordError("");

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }
    setConfirmPasswordError("");

    setDirection("forward");
    setStep(3);
  };

  const uploadProfileImage = async (image: File) => {
    console.log(image);
    const formData = new FormData();
    formData.append("image", image);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/profileImage`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload image");
      }

      return data.url; // Return uploaded Cloudinary URL
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast.add({
        type: "error",
        title: "Image Upload Failed",
        description:
          "There was an error uploading your profile image. Please try again.",
      });
      return null;
    }
  };

  const handleRegistration = async () => {
    setIsLoading(true);
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await uploadProfileImage(image);
      if (!imageUrl) {
        {
          setIsLoading(false);
          return;
        }
      }
    }
    const data = {
      name,
      email,
      address,
      phone,
      password,
      image: imageUrl,
    };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      setIsLoading(false);
      toast.add({
        type: "success",
        title: "Registration Successful",
        description: "Your account has been registered successfully.",
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: "Registration Failed",
        description:
          "There was an error registering your account. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setDirection("backward");
    setStep(step - 1);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <div className="relative h-1 w-full bg-gray-200">
          <div
            className="absolute left-0 top-0 h-full bg-gray-800 transition-all duration-500 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <div className="text-xs text-gray-500">Step 1 of 3</div>
              </div>
              <CardDescription>Enter your basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-start">
                {imagePreview && (
                  <Image
                    width={100}
                    height={100}
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-md object-cover border border-gray-300"
                  />
                )}
                <div className="flex-1">
                  <label
                    htmlFor="add-image"
                    className="h-24 w-24 text-center border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer text-xs text-muted-foreground"
                  >
                    <UploadCloud className="h-4 w-4 mb-1" />
                    Add Image
                  </label>
                  <Input
                    id="add-image"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="mb-2">
                  Full name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="mb-2">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500">{emailError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="mb-2">
                  Phone number (optional)
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
            </CardContent>
            <CardFooter className="mb-5">
              <Button
                className="w-full"
                disabled={!name && !email && !phone && !address}
                onClick={handleStepOneSubmit}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBack}
                    className="mr-2 h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>Create a password</CardTitle>
                </div>
                <div className="text-xs text-gray-500">Step 2 of 3</div>
              </div>
              <CardDescription>Choose a secure password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password" className="mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="mb-2">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-red-500">{confirmPasswordError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="mb-5">
              <Button
                className="w-full"
                disabled={!password && !confirmPassword}
                onClick={handleStepTwoSubmit}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="transition-all duration-500 ease-in-out">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review & Confirm</CardTitle>
                <div className="text-xs text-gray-500">Step 3 of 3</div>
              </div>
              <CardDescription>
                Make sure your details are correct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className=" p-4 mb-2 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Name</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Email</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{email}</span>
                    </div>
                  </div>
                  {phone && (
                    <div className="flex justify-between">
                      <span>Phone</span>
                      <span className="font-medium">{phone}</span>
                    </div>
                  )}
                  {address && (
                    <div className="flex justify-between">
                      <span>Address</span>
                      <span className="font-medium">{address}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setStep(1);
                      setDirection("backward");
                    }}
                    className="p-0"
                  >
                    Edit
                  </Button>
                </div>
                <div className="mb-5 rounded-md">
                  <div className="flex items-center justify-between px-4 gap-2">
                    <span>Password</span>
                    <span className="font-medium">••••••••</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStep(2);
                        setDirection("backward");
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="">
              <Button
                className="w-full rounded-xs"
                onClick={handleRegistration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Create Account
                  </>
                )}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
