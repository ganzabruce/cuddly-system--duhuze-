"use client";

import Link from "next/link";
import type {
    HealthCheckResult,
    OverallHealthStatus,
    ServiceCheckResult,
} from "@/types/admin";

const STATUS_FILL: Record<
    ServiceCheckResult["status"],
    { fill: string; label: string }
> = {
    healthy: { fill: "#22c55e", label: "Healthy" },
    degraded: { fill: "#f59e0b", label: "Degraded" },
    down: { fill: "var(--destructive)", label: "Down" },
    not_configured: { fill: "var(--muted-foreground)", label: "N/A" },
};

/** Path for a donut segment: outer arc + inner arc. */
function getDonutSegmentPath(
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    startAngle: number,
    endAngle: number
): string {
    const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
    const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return [
        "M", outerStart.x, outerStart.y,
        "A", outerR, outerR, 0, largeArc, 1, outerEnd.x, outerEnd.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerR, innerR, 0, largeArc, 0, innerStart.x, innerStart.y,
        "Z",
    ].join(" ");
}

function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
): { x: number; y: number } {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

type AppHealthChartProps = {
    result: HealthCheckResult;
    overall: OverallHealthStatus;
};

export function AppHealthChart({ result, overall }: AppHealthChartProps) {
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 56;
    const innerRadius = 32;
    const segmentAngle = 360 / result.services.length;

    const healthyCount = result.services.filter(
        (s) => s.status === "healthy" || s.status === "degraded"
    ).length;
    const total = result.services.length;

    return (
        <Link
            href="/admin/health"
            className="block rounded-md border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-md"
        >
            <div className="flex flex-wrap items-center gap-6">
                <div className="relative shrink-0">
                    <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="overflow-visible"
                        aria-hidden
                    >
                        {result.services.map((service, i) => {
                            const startAngle = i * segmentAngle;
                            const endAngle = startAngle + segmentAngle;
                            const config = STATUS_FILL[service.status];
                            return (
                                <path
                                    key={service.name}
                                    d={getDonutSegmentPath(
                                        cx,
                                        cy,
                                        radius,
                                        innerRadius,
                                        startAngle,
                                        endAngle
                                    )}
                                    fill={config.fill}
                                    className="transition-opacity hover:opacity-90"
                                />
                            );
                        })}
                        <circle
                            cx={cx}
                            cy={cy}
                            r={innerRadius - 2}
                            fill="var(--card)"
                            stroke="var(--border)"
                            strokeWidth="1"
                        />
                    </svg>
                    <div
                        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
                        style={{ width: innerRadius * 1.6 }}
                    >
                        <span className="text-lg font-bold tabular-nums text-foreground">
                            {healthyCount}/{total}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            healthy
                        </span>
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                        App health
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {overall === "healthy" && "All services operational"}
                        {overall === "degraded" && "Some services slow or degraded"}
                        {overall === "down" && "One or more services down"}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                        {result.services.map((service) => {
                            const config = STATUS_FILL[service.status];
                            return (
                                <li
                                    key={service.name}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: config.fill }}
                                    />
                                    <span className="truncate text-foreground">
                                        {service.name}
                                    </span>
                                    {service.latencyMs != null &&
                                        service.status !== "not_configured" && (
                                            <span className="shrink-0 tabular-nums text-muted-foreground">
                                                {service.latencyMs} ms
                                            </span>
                                        )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </Link>
    );
}
