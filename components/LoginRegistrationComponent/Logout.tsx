"use client";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

const Logout = () => {
  return (
    <div>
      <Button onClick={() => signOut()} variant="default" className="p-2">
        Logout
      </Button>
    </div>
  );
};

export default Logout;
