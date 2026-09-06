"use client";

import DotField from "@/components/DotField";
import MultiStepLogin from "@/components/LoginRegistrationComponent/MultiStepLogin";
import MultiStepRegistration from "@/components/LoginRegistrationComponent/MultiStepRegistration";
import HomeNavBar from "@/components/NavBar/HomeNavBar";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

const Authentication = () => {
  const [haveAccount, setHaveAccount] = useState(true);
  return (
    <main className="flex min-h-screen items-center w-full justify-center p-4">
      <DotField
        className="absolute inset-0 z-0"
        dotRadius={1.5}
        dotSpacing={14}
        bulgeStrength={67}
        glowRadius={160}
        sparkle={false}
        waveAmplitude={0}
        cursorRadius={500}
        cursorForce={0.1}
        bulgeOnly
        gradientFrom="rgba(168, 85, 247, 0.55)"
        gradientTo="rgba(180, 151, 207, 0.3)"
        glowColor="#A855F7"
      />
      <HomeNavBar />
      <div className="w-full z-10 flex flex-col items-center justify-center gap-4  px-6 py-8 text-white ">
        {haveAccount ? (
          <h4 className="text-sm">
            Are you not registered yet?{" "}
            <Button
              onClick={() => setHaveAccount(!haveAccount)}
              variant="link"
              className="p-0"
            >
              Create New Account
            </Button>
          </h4>
        ) : (
          <h4 className="text-sm">
            Already have an account?{" "}
            <Button
              onClick={() => setHaveAccount(!haveAccount)}
              variant="link"
              className="p-0"
            >
              Login
            </Button>
          </h4>
        )}
        {haveAccount ? (
          <MultiStepLogin />
        ) : (
          <MultiStepRegistration setHaveAccount={setHaveAccount} />
        )}
      </div>
    </main>
  );
};

export default Authentication;
