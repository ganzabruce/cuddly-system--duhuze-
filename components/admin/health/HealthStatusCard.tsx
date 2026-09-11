"use client";

import type { SerializedServiceCheckResult } from "@/types/admin";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";

type HealthStatusCardProps = {
    result: SerializedServiceCheckResult;
};

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function HealthStatusCard({ result }: HealthStatusCardProps) {
    return (
        <div className="rounded-md border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-foreground">{result.name}</h3>
                    <div className="mt-2">
                        <ServiceStatusIndicator status={result.status} />
                    </div>
                    {result.message && (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {result.message}
                        </p>
                    )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                    {result.latencyMs != null && (
                        <div className="font-medium tabular-nums text-foreground">
                            {result.latencyMs} ms
                        </div>
                    )}
                    <div>Checked {formatTime(result.lastChecked)}</div>
                </div>
            </div>
        </div>
    );
}
