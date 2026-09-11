import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/actions/admin/auth";
import { getUnresolvedErrorCount } from "@/actions/admin/error-log";
import { SidebarInset } from "@/components/layout/sidebar/inset";
import { SidebarProvider } from "@/components/layout/sidebar/provider";
import { AppTopLoader } from "@/components/layout/AppTopLoader";

/**
 * Admin dashboard shell with sidebar and header.
 * Only applies to routes under /admin that are not /admin/login.
 */
export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();
    const unresolvedErrorCount = await getUnresolvedErrorCount();
    return (
        <SidebarProvider>
            <AppTopLoader />
            <AdminSidebar unresolvedErrorCount={unresolvedErrorCount} />
            <SidebarInset>
                <AdminHeader />
                <div className="flex flex-1 flex-col gap-6 bg-background p-4 md:p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
