import { Suspense } from "react";
import { OverviewPage } from "@/components/events/overview/OverviewPage";
import { DashboardOverviewSkeleton } from "@/components/skeletons/DashboardOverviewSkeleton";
import { getDashboardOverviewData } from "@/actions/events/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Overview | Duhuze RSVP",
};

export default function DashboardOverviewPage() {
    return (
        <Suspense fallback={<DashboardOverviewSkeleton />}>
            <OverviewPage dataPromise={getDashboardOverviewData()} />
        </Suspense>
    );
}
