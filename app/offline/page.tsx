import type { Metadata } from "next";
import Link from "next/link";
import { WifiIcon } from "@heroicons/react/24/outline";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";

export const metadata: Metadata = {
  title: "Offline | Duhuze RSVP",
  description: "You're offline. Connect to the internet and try again.",
};

export default function OfflinePage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-8">
      <HeroPattern />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(26,20,18,0.08) 0%, transparent 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
          <WifiIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-display text-6xl font-extrabold tracking-tight text-foreground/20 sm:text-8xl">
          Offline
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
          No Connection
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
          You appear to be offline. Check your connection and try again.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
