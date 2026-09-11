import Link from "next/link";
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { default as Header } from "@/components/layout/Header";

function RowArrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      data-slot="icon"
      aria-hidden="true"
      className="h-5 w-5 flex-none text-muted-foreground"
    >
      <path
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
}

export default async function NotFound() {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 sm:px-6 py-16 sm:py-24 lg:py-32 lg:px-8">
        <div className="opacity-20"><HeroPattern /></div>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.05) 0%, transparent 100%)",
          }}
        />
        <div className="relative z-10 text-center max-w-2xl">
          <p className="font-display text-6xl font-extrabold tracking-tight text-foreground/20 sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
            Page Not Found
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
            have been moved or doesn&apos;t exist.
          </p>
        </div>
        <div className="mt-16 w-full max-w-2xl relative z-10">
          <h2 className="text-sm font-semibold text-foreground">Popular pages</h2>
          <ul
            role="list"
            className="mt-8 divide-y divide-border border-b border-border"
          >
            <li className="relative flex justify-between gap-x-6 py-6">
              <div className="flex gap-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary">
                  <CalendarDaysIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-auto">
                  <h3 className="text-sm font-semibold leading-6 text-foreground">
                    <Link href="/new">
                      <span aria-hidden="true" className="absolute inset-0" />
                      Create Event
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Start planning your next event with ease.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <RowArrow />
              </div>
            </li>
            <li className="relative flex justify-between gap-x-6 py-6">
              <div className="flex gap-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary">
                  <MagnifyingGlassIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-auto">
                  <h3 className="text-sm font-semibold leading-6 text-foreground">
                    <Link href="/explore">
                      <span aria-hidden="true" className="absolute inset-0" />
                      Explore Events
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Discover and join amazing events in your area.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <RowArrow />
              </div>
            </li>
            <li className="relative flex justify-between gap-x-6 py-6">
              <div className="flex gap-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-auto">
                  <h3 className="text-sm font-semibold leading-6 text-foreground">
                    <Link href="/support">
                      <span aria-hidden="true" className="absolute inset-0" />
                      Help & Support
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Get help with using Duhuze RSVP.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <RowArrow />
              </div>
            </li>
          </ul>
        </div>
      </main>
    </div>
    </NextIntlClientProvider>
  );
}
