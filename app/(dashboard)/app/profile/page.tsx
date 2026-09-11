import { Suspense } from "react";
import { DashboardProfilePage } from "@/components/auth/DashboardProfilePage";
import { DashboardProfileSkeleton } from "@/components/skeletons/DashboardProfileSkeleton";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { getDashboardProfileData } from "@/actions/auth/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profile | Duhuze RSVP",
};

export default function DashboardProfileRoute() {
    return (
        <div className="w-full min-w-0">
            <DashboardPageHeader
                title="Account"
                subtitle="Manage how your organizer profile appears to guests across your events."
            />
            <Suspense fallback={<DashboardProfileSkeleton />}>
                <DashboardProfilePage dataPromise={getDashboardProfileData()} />
            </Suspense>
        </div>
    );
}
