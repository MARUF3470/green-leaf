// components/NavBar.tsx
import { User } from "@/types/UserTypes";
import { Leaf } from "lucide-react";

import Link from "next/link";
import Logout from "../LoginRegistrationComponent/Logout";

export default function HomeNavBar({ user }: { user: User }) {
  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 py-3 mt-3">
      <nav className="mx-auto flex h-16 max-w-4/5 items-center justify-between rounded-lg border border-white/10 bg-black/35 px-6 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <Link
          href="/"
          className="text-lg font-semibold tracking-normal flex items-center justify-center gap-1"
        >
          <Leaf /> Green Leaf
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/about" className="transition hover:text-white">
            Features
          </Link>
          <Link href="/about" className="transition hover:text-white">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-white">
            Contact
          </Link>
          <Link href="/create-business" className="transition hover:text-white">
            Create Your Business
          </Link>
        </div>

        {user ? (
          <Logout />
        ) : (
          <Link
            href="/authentication"
            className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
