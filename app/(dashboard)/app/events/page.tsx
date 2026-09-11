import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@/components/ui/button-variants";
import { ViewToggle, type ViewMode } from "@/components/events/ViewToggle";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { DashboardEventsPage } from "@/components/events/DashboardEventsPage";
import { DashboardEventsSkeleton } from "@/components/skeletons/DashboardEventsSkeleton";
import { getDashboardEvents } from "@/actions/events/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Events | Duhuze RSVP",
};

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>;
}) {
    const { view } = await searchParams;
    const currentView: ViewMode = view === "grid" ? "grid" : "list";
    const eventsPromise = getDashboardEvents();

    return (
        <div className="min-h-full w-full min-w-0">
            <DashboardPageHeader
                title="My Events"
                subtitle="Create and manage your events"
                variant="plain"
                actions={
                    <>
                        <ViewToggle current={currentView} />
                        <Link href="/new" className={buttonVariants({ variant: "default" })}>
                            <PlusIcon className="size-4" />
                            New event
                        </Link>
                    </>
                }
            />
            <Suspense fallback={<DashboardEventsSkeleton />}>
                <DashboardEventsPage view={view} eventsPromise={eventsPromise} />
            </Suspense>
        </div>
    );
}
