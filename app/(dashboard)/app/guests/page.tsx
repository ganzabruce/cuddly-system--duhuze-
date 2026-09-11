import { Suspense } from "react";
import { DashboardAllGuestsPage } from "@/components/guests/DashboardAllGuestsPage";
import { DashboardGuestsSkeleton } from "@/components/skeletons/DashboardGuestsSkeleton";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { getDashboardAllGuests } from "@/actions/guests/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "All Guests | Dashboard",
    description: "View and manage all guests across your events",
};

export default function AllGuestsPage() {
    return (
        <div className="w-full min-w-0">
            <DashboardPageHeader
                title="All Guests"
                subtitle="Manage guests across all your events"
            />
            <div className="rounded-md border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                    <h2 className="m-0 text-base font-semibold text-foreground">
                        Guests
                    </h2>
                </div>
                <div className="p-4">
                    <Suspense fallback={<DashboardGuestsSkeleton />}>
                        <DashboardAllGuestsPage dataPromise={getDashboardAllGuests()} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
