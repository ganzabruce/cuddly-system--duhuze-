"use client";

import Link from "next/link";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import type { OverallHealthStatus, SerializedHealthCheckResult } from "@/types/admin";

type AppHealthStatusBannerProps = {
    result: SerializedHealthCheckResult;
    overall: OverallHealthStatus;
    /** If true, render a compact version (e.g. for Errors page). */
    compact?: boolean;
};

const statusConfig: Record<
    OverallHealthStatus,
    { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
    healthy: {
        label: "All systems operational",
        icon: CheckCircleIcon,
        className: "border-success/30 bg-success/10 text-success",
    },
    degraded: {
        label: "Some services degraded",
        icon: ExclamationTriangleIcon,
        className: "border-warning/30 bg-warning/10 text-warning-deep",
    },
    down: {
        label: "Service outage",
        icon: XCircleIcon,
        className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
};

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function AppHealthStatusBanner({
    result,
    overall,
    compact = false,
}: AppHealthStatusBannerProps) {
    const config = statusConfig[overall];
    const Icon = config.icon;
    const healthyCount = result.services.filter(
        (s) => s.status === "healthy" || s.status === "degraded"
    ).length;
    const totalRelevant = result.services.filter(
        (s) => s.status !== "not_configured"
    ).length;

    if (compact) {
        return (
            <Link
                href="/admin/health"
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:opacity-90 ${config.className}`}
            >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{config.label}</span>
                <span className="opacity-80">
                    {healthyCount}/{totalRelevant} services
                </span>
            </Link>
        );
    }

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-4 rounded-md border px-4 py-4 ${config.className}`}
        >
            <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 shrink-0" />
                <div>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-sm opacity-90">
                        {healthyCount} of {totalRelevant} services healthy
                        {result.services.some((s) => s.status === "not_configured") &&
                            " (optional services excluded)"}
                    </p>
                </div>
            </div>
            <div className="text-sm opacity-80">
                Last checked {formatTime(result.checkedAt)}
            </div>
        </div>
    );
}
