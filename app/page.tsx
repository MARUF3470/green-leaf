import DotField from "@/components/DotField";
import HomeNavBar from "@/components/NavBar/HomeNavBar";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  console.log(session, "server session");
  const user = session?.user;
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
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
      <HomeNavBar user={user} />
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold tracking-normal">
          Welcome to Green Leaf
        </h1>

        <p className="mt-4 max-w-xl text-lg text-white/70">
          Let us help you grow your business with our innovative solutions. Join
          us today and experience the difference!
        </p>

        <Button variant="default" className=" my-5 p-5">
          <Link className="flex items-center gap-2" href="/authentication">
            Get Started
          </Link>
        </Button>
      </section>
    </main>
  );
}
