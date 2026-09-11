"use client";

import { DashboardTopNavBreadcrumbs } from "@/components/layout/DashboardTopNavBreadcrumbs";
import { DashboardSearch } from "@/components/layout/dashboardSearch";
import type { NotificationCounts, NotificationInboxItem } from "@/types/notifications";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export interface DashboardTopNavProps {
    initialNotifications: NotificationInboxItem[];
    initialNotificationCounts: NotificationCounts;
}

export function DashboardTopNav({
    initialNotifications,
    initialNotificationCounts,
}: DashboardTopNavProps) {
    return (
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 py-3 transition-[height] ease-linear">
            <div className="flex min-w-0 items-center gap-2">
                <DashboardTopNavBreadcrumbs />
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden md:block">
                    <DashboardSearch />
                </div>
                <NotificationDropdown
                    initialNotifications={initialNotifications}
                    initialCounts={initialNotificationCounts}
                />
                <ThemeToggle />
            </div>
        </header>
    );
}
