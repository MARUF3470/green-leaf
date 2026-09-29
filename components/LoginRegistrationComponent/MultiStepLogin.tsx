"use client";
import { toast } from "@/components/ui/toast";
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
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  LogIn,
} from "lucide-react";

import { useRouter } from "next/navigation";
import LoginAlertDialoge from "./LoginAlertDialoge";

import { signIn, useSession } from "next-auth/react";

// Email validation schema
const emailSchema = z
  .string()
  .email({ message: "Please enter a valid email address" });

export default function MultiStepLogin() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState("forward");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertRole, setAlertRole] = useState<"Admin" | "Dealer" | null>(null);

  // Validate email and move to next step
  const { data } = useSession();

  const handleEmailSubmit = () => {
    try {
      emailSchema.parse(email);
      setEmailError("");
      setDirection("forward");
      setStep(2);
    } catch (error) {
      setEmailError("Please enter a valid email address");
    }
  };

  // Validate password and move to next step
  const handlePasswordSubmit = () => {
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordError("");
    setDirection("forward");
    setStep(3);
  };

  // Handle login submission
  const handleLogin = async () => {
    const signInData = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInData?.ok) {
      toast.add({
        type: "success",
        title: "Login Successful",
        description: "You have been logged in successfully.",
      });
      console.log("signInData", signInData);

      if (data?.user?.role === "OWNER") {
        return router.push("/merchant");
      }

      if (data?.user?.role === "ADMIN") {
        return router.push("/admin");
      }

      if (data?.user?.role === "EMPLOYEE") {
        return router.push("/employee");
      }

      return router.push("/");
    }

    toast.add({
      type: "error",
      title: "Login Failed",
      description: "Invalid email or password.",
    });
  };

  // Go back to previous step
  const goBack = () => {
    setDirection("backward");
    setStep(step - 1);
  };

  return (
    <Card className="w-full max-w-md overflow-clip">
      {/* Progress indicator */}
      <div className="relative h-1 w-full bg-gray-200">
        <div
          className="absolute left-0 top-0 h-full bg-gray-800 transition-all duration-500 ease-in-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      <CardTitle className="text-center">Login</CardTitle>
      <div className="relative">
        {/* Email Step */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            step === 1
              ? "translate-x-0 opacity-100"
              : direction === "forward"
                ? "-translate-x-full opacity-0"
                : "translate-x-full opacity-0"
          } ${step !== 1 ? "absolute inset-0" : ""}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enter your email</CardTitle>
              <div className="text-xs text-gray-500">Step 1 of 3</div>
            </div>
            <CardDescription className="mb-3">
              We&apos;ll use your email to sign you in
            </CardDescription>
          </CardHeader>
          <CardContent className="mb-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleEmailSubmit();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500">{emailError}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mb-5">
            <Button
              className="w-full"
              onClick={handleEmailSubmit}
              disabled={!email}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </div>

        {/* Password Step */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            step === 2
              ? "translate-x-0 opacity-100"
              : step < 2
                ? "translate-x-full opacity-0"
                : "-translate-x-full opacity-0"
          } ${step !== 2 ? "absolute inset-0" : ""}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 h-8 w-8"
                  onClick={goBack}
                  aria-label="Go back to email"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Enter your password</CardTitle>
              </div>
              <div className="text-xs text-gray-500">Step 2 of 3</div>
            </div>
            <CardDescription className="mb-3">
              Please enter your password for {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="mb-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePasswordSubmit();
                      }
                    }}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mb-5">
            <Button
              className="w-full"
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </div>

        {/* Confirmation Step */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            step === 3
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          } ${step !== 3 ? "absolute inset-0" : ""}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 h-8 w-8"
                  onClick={goBack}
                  aria-label="Go back to password"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Ready to login</CardTitle>
              </div>
              <div className="text-xs text-gray-500">Step 3 of 3</div>
            </div>
            <CardDescription className="mb-3">
              Click the button below to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="mb-3">
            <div className="rounded-lg p-4">
              <div className="mb-2 text-sm font-medium text-gray-500">
                Account details
              </div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">{email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setDirection("backward");
                    setStep(1);
                  }}
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">••••••••</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setDirection("backward");
                    setStep(2);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mb-5">
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </CardFooter>
        </div>
        <LoginAlertDialoge
          text={alertRole ?? ""}
          open={alertOpen}
          onOpenChange={setAlertOpen}
          link={
            alertRole === "Dealer"
              ? "http://localhost:3001/"
              : "http://localhost:3002"
          }
        />
      </div>
    </Card>
  );
}
