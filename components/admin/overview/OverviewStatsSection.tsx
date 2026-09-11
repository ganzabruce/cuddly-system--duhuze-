"use client";

import { use } from "react";
import Link from "next/link";
import type { getOverviewData } from "@/actions/admin/overview";
import { PlatformStatsCards } from "@/components/admin/PlatformStatsCards";
import { Badge } from "@/components/ui/badge";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export function OverviewStatsSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getOverviewData>;
}) {
    const { stats } = use(dataPromise);

    return (
        <>
            <PlatformStatsCards
                totalUsers={stats.totalUsers}
                totalEvents={stats.totalEvents}
                totalRSVPs={stats.totalRSVPs}
            />
            <div className="min-h-[320px] rounded-md border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="m-0 text-base font-semibold text-foreground">
                        Recent Events
                    </h2>
                    <Link
                        href="/admin/events"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        View all
                    </Link>
                </div>
                <div className="flex max-h-[320px] flex-col overflow-y-auto p-4">
                    {stats.recentEvents.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No recent events
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/admin/events/${event.username}/${event.slug}`}
                                    className="flex items-center gap-3 rounded-md border border-border bg-background p-3 transition hover:border-primary/30"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CalendarDaysIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="truncate text-sm font-medium text-foreground">
                                                {event.title}
                                            </div>
                                            <Badge
                                                variant={
                                                    event.visibility === "public"
                                                        ? "primary"
                                                        : "secondary"
                                                }
                                            >
                                                {event.visibility}
                                            </Badge>
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            by {event.organizerName}
                                            {event.organizerUsername && ` (@${event.organizerUsername})`}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        <div>{new Date(event.date).toLocaleDateString()}</div>
                                        <div className="text-muted-foreground/70">
                                            {new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
