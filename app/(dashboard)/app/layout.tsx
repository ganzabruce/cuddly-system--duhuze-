import { SidebarInset } from "@/components/layout/sidebar/inset";
import { SidebarProvider } from "@/components/layout/sidebar/provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { getNotificationsSnapshotAction } from "@/actions/notifications/actions";
import type {
    NotificationCounts,
    NotificationInboxItem,
} from "@/types/notifications";
import { getActiveEvents } from "@/actions/events/get-events";
import { getResolvedEntitlements } from "@/lib/services/billing/entitlements";
import { DbDependencyError } from "@/lib/db/errors";
import { MaintenanceScreen } from "@/components/ui/errors/MaintenanceScreen";
import { redirect } from "next/navigation";
import logger from "@/lib/utils/logger";

export default async function DashboardChromeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let user;
    try {
        user = await getCurrentUser();
    } catch (error) {
        if (error instanceof DbDependencyError) {
            return <MaintenanceScreen />;
        }
        throw error;
    }

    if (!user) {
        redirect("/login");
    }

    let initialNotifications: NotificationInboxItem[] = [];
    let initialNotificationCounts: NotificationCounts = {
        all: 0,
        unread: 0,
        read: 0,
    };
    try {
        const snapshot = await getNotificationsSnapshotAction();
        if (snapshot.success) {
            initialNotifications = snapshot.notifications;
            initialNotificationCounts = snapshot.counts;
        }
    } catch (error) {
        logger.warn("Dashboard notifications unavailable", {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    let sidebarEvents: Awaited<ReturnType<typeof getActiveEvents>> = [];
    let maxActiveEvents: number | null = null;
    try {
        const entitlements = await getResolvedEntitlements(user.id);
        maxActiveEvents = entitlements.limits.maxActiveEvents;
        sidebarEvents = await getActiveEvents(user.id, 5);
    } catch (error) {
        logger.warn("Sidebar active events unavailable", {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return (
        <SidebarProvider>
            <AppSidebar
                name={user.name}
                email={user.email}
                profileUsername={user.username}
                profileImageUrl={user.profileImageUrl}
                activeEvents={sidebarEvents}
                maxActiveEvents={maxActiveEvents}
            />
            <SidebarInset>
                <DashboardTopNav
                    initialNotifications={initialNotifications}
                    initialNotificationCounts={initialNotificationCounts}
                />
                <div className="flex flex-1 flex-col gap-6 bg-background p-4 pt-4 md:p-6 md:pt-5">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
