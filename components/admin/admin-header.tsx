"use client";

import { DashboardTopNavBreadcrumbs } from "@/components/layout/DashboardTopNavBreadcrumbs";
import { AdminHeaderSearch } from "@/components/admin/admin-header-search";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const ADMIN_SEGMENT_LABELS: Record<string, string> = {
    admin: "Admin",
    overview: "Overview",
    users: "Users",
    events: "Events",
    admins: "Admins",
    errors: "Errors",
    health: "Health",
    "audit-log": "Audit Log",
    settings: "Settings",
};

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 py-3 transition-[height] ease-linear">
            <div className="flex min-w-0 items-center gap-2">
                <DashboardTopNavBreadcrumbs
                    segmentLabels={ADMIN_SEGMENT_LABELS}
                    homeLabel="Admin"
                    homeHref="/admin/overview"
                    rootSegment="admin"
                />
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden md:block">
                    <AdminHeaderSearch />
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}
