"use client";

import { use } from "react";
import Link from "next/link";
import type { getOverviewData } from "@/actions/admin/overview";
import { AppHealthChart } from "@/components/admin/health/AppHealthChart";
import { UserIcon } from "@heroicons/react/24/outline";

export function OverviewHealthSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getOverviewData>;
}) {
    const { stats, healthResult, overallHealth } = use(dataPromise);

    return (
        <>
            <AppHealthChart
                result={{
                    ...healthResult,
                    checkedAt: new Date(healthResult.checkedAt),
                    services: healthResult.services.map((s) => ({
                        ...s,
                        lastChecked: new Date(s.lastChecked),
                    })),
                }}
                overall={overallHealth}
            />

            <div className="flex-1 rounded-md border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="m-0 text-base font-semibold text-foreground">
                        Recent Signups
                    </h2>
                    <Link
                        href="/admin/users"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        View all
                    </Link>
                </div>
                <div className="flex max-h-[320px] flex-col overflow-y-auto p-4">
                    {stats.recentSignups.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No recent signups
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentSignups.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/admin/users/${user.username}`}
                                    className="flex items-center gap-3 rounded-md border border-border bg-background p-3 transition hover:border-primary/30"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-foreground">
                                            {user.name}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
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
