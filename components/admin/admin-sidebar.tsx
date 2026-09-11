"use client";

import * as React from "react";
import {
    HomeIcon,
    UserPlusIcon,
    UsersIcon,
    CalendarIcon,
    ExclamationTriangleIcon,
    HeartIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    MegaphoneIcon,
    BeakerIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar/main";
import { SidebarMenu, SidebarMenuItem, SidebarMenuLink } from "@/components/layout/sidebar/menu";
import { SidebarContent, SidebarHeader, SidebarRail } from "@/components/layout/sidebar/sections";
import { BrandLogo } from "@/components/layout/BrandLogo";

const navItems = [
    { title: "Overview", url: "/admin/overview", icon: HomeIcon },
    { title: "Users", url: "/admin/users", icon: UsersIcon },
    { title: "Events", url: "/admin/events", icon: CalendarIcon },
    { title: "Billing", url: "/admin/billing", icon: CreditCardIcon },
    { title: "Announcements", url: "/admin/announcements", icon: MegaphoneIcon },
    { title: "Admins", url: "/admin/admins", icon: UserPlusIcon },
    { title: "Errors", url: "/admin/errors", icon: ExclamationTriangleIcon },
    { title: "Health", url: "/admin/health", icon: HeartIcon },
    { title: "Audit Log", url: "/admin/audit-log", icon: ClipboardDocumentListIcon },
    { title: "Test Payments", url: "/admin/test-payments", icon: BeakerIcon },
    { title: "Settings", url: "/admin/settings", icon: Cog6ToothIcon },
] as const;

type AdminSidebarProps = {
    unresolvedErrorCount?: number;
};

export function AdminSidebar({ unresolvedErrorCount = 0 }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex flex-col gap-1 px-4 pt-6 pb-5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:pt-5 group-data-[collapsible=icon]:pb-3">
                    <div className="flex items-center gap-3">
                        <BrandLogo alt="Duhuze RSVP" className="h-10 w-auto" />
                    </div>
                    <span className="text-sm text-muted-foreground duration-300 group-data-[collapsible=icon]:hidden">
                        Admin dashboard
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent className="px-2 group-data-[collapsible=icon]:px-3">
                <nav className="flex flex-1 flex-col gap-0 py-2 group-data-[collapsible=icon]:gap-3 group-data-[collapsible=icon]:py-3">
                    <SidebarMenu>
                        {navItems.map((item) => {
                            const isActive =
                                item.url === pathname ||
                                (item.url !== "/admin/overview" &&
                                    pathname.startsWith(item.url));
                            const showErrorBadge =
                                item.url === "/admin/errors" && unresolvedErrorCount > 0;
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuLink
                                        href={item.url}
                                        isActive={isActive}
                                        tooltip={item.title}
                                        className="sidebar-nav-item"
                                    >
                                        <item.icon className="size-5 shrink-0" />
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            {item.title}
                                        </span>
                                        {showErrorBadge && (
                                            <span
                                                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground group-data-[collapsible=icon]:hidden"
                                                aria-label={`${unresolvedErrorCount} unresolved errors`}
                                            >
                                                {unresolvedErrorCount > 99 ? "99+" : unresolvedErrorCount}
                                            </span>
                                        )}
                                    </SidebarMenuLink>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </nav>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
