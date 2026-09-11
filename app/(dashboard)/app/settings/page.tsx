import { Suspense } from "react";
import { DashboardSettingsPage } from "@/components/auth/DashboardSettingsPage";
import { DashboardSettingsSkeleton } from "@/components/skeletons/DashboardSettingsSkeleton";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { getDashboardSettingsData } from "@/actions/auth/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Duhuze RSVP",
};

export default function SettingsPage() {
    return (
        <div className="w-full min-w-0">
            <DashboardPageHeader
                title="Settings"
                subtitle="Manage your preferences, notifications, and account"
            />
            <Suspense fallback={<DashboardSettingsSkeleton />}>
                <DashboardSettingsPage dataPromise={getDashboardSettingsData()} />
            </Suspense>
        </div>
    );
}
