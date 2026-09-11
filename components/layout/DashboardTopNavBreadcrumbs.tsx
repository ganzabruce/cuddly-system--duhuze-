"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/layout/sidebar/trigger";
import { Separator } from "@/components/ui/separator";

const DEFAULT_SEGMENT_LABELS: Record<string, string> = {
    overview: "Overview",
    events: "Events",
    guests: "Guests",
    analytics: "Analytics",
    settings: "Settings",
    billing: "Billing",
    profile: "Profile",
    new: "New event",
};

interface TopNavBreadcrumbsProps {
    segmentLabels?: Record<string, string>;
    homeLabel?: string;
    homeHref?: string;
    /** Segment to skip as the root (e.g. "dashboard" or "admin") */
    rootSegment?: string;
}

function generateBreadcrumbs(
    pathname: string,
    labels: Record<string, string>,
    homeLabel: string,
    homeHref: string,
    rootSegment: string,
) {
    function labelFor(segment: string) {
        return labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [
        { label: homeLabel, href: homeHref },
    ];
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        currentPath += `/${segment}`;
        if (segment === rootSegment && i === 0) continue;
        crumbs.push({ label: labelFor(segment), href: currentPath });
    }
    return crumbs;
}

export function DashboardTopNavBreadcrumbs({
    segmentLabels,
    homeLabel = "Dashboard",
    homeHref = "/app/overview",
    rootSegment = "dashboard",
}: TopNavBreadcrumbsProps = {}) {
    const labels = segmentLabels ?? DEFAULT_SEGMENT_LABELS;
    const pathname = usePathname();
    const crumbs = generateBreadcrumbs(pathname, labels, homeLabel, homeHref, rootSegment);

    return (
        <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <nav className="min-w-0 flex items-center gap-0.5 overflow-hidden" aria-label="Breadcrumb">
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <React.Fragment key={index}>
                            {isLast ? (
                                <span className="truncate text-sm font-semibold text-foreground">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                            {!isLast && (
                                <span className="mx-1 text-sm text-muted-foreground/40">/</span>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>
        </div>
    );
}
