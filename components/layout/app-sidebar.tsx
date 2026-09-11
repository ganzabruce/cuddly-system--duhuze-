"use client";

import * as React from "react";
import {
    ArrowDownTrayIcon,
    HomeIcon,
    CalendarIcon,
    UsersIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";
import { ThemeImage } from "@/components/ui/theme-image";

import { Sidebar } from "@/components/layout/sidebar/main";
import { SidebarMenu, SidebarMenuItem, SidebarMenuLink } from "@/components/layout/sidebar/menu";
import { SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/layout/sidebar/sections";
import { UserMenu } from "@/components/layout/UserMenu";
import { usePWAInstall } from "@/components/providers/PWAInstallProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { brandIcons } from "@/public";

const navItems = [
    { title: "Overview", url: "/app/overview", icon: HomeIcon },
    { title: "Events", url: "/app/events", icon: CalendarIcon },
    { title: "Guests", url: "/app/guests", icon: UsersIcon },
    { title: "Analytics", url: "/app/analytics", icon: ChartBarIcon },
] as const;

type SidebarEvent = {
    id: number;
    title: string;
    slug: string;
    username: string;
    date: Date;
    endDate: Date | null;
    status: string | null;
};

type AppSidebarProps = {
    name: string;
    email: string;
    profileUsername?: string | null;
    profileImageUrl?: string | null;
    activeEvents?: SidebarEvent[];
    maxActiveEvents?: number | null;
};

export function AppSidebar({
    name,
    email,
    profileUsername = null,
    profileImageUrl = null,
    activeEvents = [],
    maxActiveEvents = null,
}: AppSidebarProps) {
    const pathname = usePathname();
    const { canInstall, isInstalled, install } = usePWAInstall();
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex flex-col gap-2 px-4 pt-5 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
                    <Link
                        href="/app/overview"
                        className="flex items-center gap-2.5 rounded-md outline-hidden transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <div className="group-data-[collapsible=icon]:hidden">
                            <BrandLogo priority />
                        </div>
                        <div className="hidden group-data-[collapsible=icon]:flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
                            <ThemeImage
                                lightSrc={brandIcons.iconLight}
                                darkSrc={brandIcons.iconDark}
                                alt="Duhuze"
                                width={32}
                                height={32}
                                className="h-8 w-8 object-cover"
                            />
                        </div>
                    </Link>
                    <span className="px-1 text-xs text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
                        Organizer dashboard
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 pb-3 group-data-[collapsible=icon]:px-2">
                <nav className="flex flex-1 flex-col gap-2 py-3">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
                        Main
                    </p>
                    <SidebarMenu className="gap-1">
                        {navItems.map((item) => {
                            const isActive =
                                item.url === pathname ||
                                (item.url !== "/app/overview" &&
                                    pathname.startsWith(item.url));
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuLink
                                        href={item.url}
                                        isActive={isActive}
                                        tooltip={item.title}
                                    >
                                        <item.icon className="size-4 shrink-0" />
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            {item.title}
                                        </span>
                                        {isActive && (
                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent group-data-[collapsible=icon]:hidden" />
                                        )}
                                    </SidebarMenuLink>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>

                    {activeEvents.length > 0 && (
                        <div className="group-data-[collapsible=icon]:hidden">
                            <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Active events
                                </p>
                                {maxActiveEvents !== null && (
                                    <span className="text-[10px] tabular-nums text-muted-foreground/60">
                                        {activeEvents.length}&thinsp;/&thinsp;{maxActiveEvents}
                                    </span>
                                )}
                            </div>
                            <ul className="flex flex-col gap-0.5">
                                {activeEvents.map((event) => {
                                    const isToday =
                                        new Date(event.date).toDateString() ===
                                        new Date().toDateString();
                                    const dotColor = isToday
                                        ? "bg-warning"
                                        : "bg-accent";
                                    const meta = isToday
                                        ? "Live"
                                        : new Date(event.date).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                          });
                                    return (
                                        <li key={event.id}>
                                            <Link
                                                href={`/app/events/${event.slug}`}
                                                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-xs font-medium leading-tight text-foreground">
                                                        {event.title}
                                                    </span>
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {meta}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </nav>
            </SidebarContent>

            <SidebarFooter className="px-3 py-3 group-data-[collapsible=icon]:p-2">
                {canInstall && !isInstalled && (
                    <>
                        <Button
                            variant="outline"
                            onClick={install}
                            className="w-full justify-start gap-2.5 border-accent/40 bg-accent-tint px-3 py-2 text-sm font-semibold text-accent-deep hover:bg-accent/15 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                        >
                            <ArrowDownTrayIcon className="size-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">Install Duhuze</span>
                        </Button>
                        <Separator />
                    </>
                )}
<UserMenu
                    name={name}
                    email={email}
                    profileUsername={profileUsername}
                    profileImageUrl={profileImageUrl}
                    sidebarMode
                    triggerClassName="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
