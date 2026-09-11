import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getDashboardSettingsData } from "@/actions/auth/actions";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NewEventLayoutClient } from "@/components/events/NewEventLayoutClient";

export default async function NewEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings: userSettings } = await getDashboardSettingsData();

  return (
    <div className="min-h-screen bg-background relative pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/app/events" className="flex items-center">
            <BrandLogo alt="Duhuze RSVP" className="h-8 w-auto" />
          </Link>

          <Link
            href="/app/events"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Discard and go back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            back to events
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <NewEventLayoutClient
          userDefaults={{
            timezone: userSettings?.timezone ?? null,
            currency: userSettings?.preferredCurrency ?? null,
            dateFormat: userSettings?.preferences?.dateFormat ?? "12h",
          }}
        >
          {children}
        </NewEventLayoutClient>
      </main>
    </div>
  );
}
