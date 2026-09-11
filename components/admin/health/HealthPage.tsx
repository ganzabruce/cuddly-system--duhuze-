"use client";

import { use, useEffect, useState } from "react";
import { getHealthDataAction } from "@/actions/admin/health";
import { HealthStatusCard } from "@/components/admin/health/HealthStatusCard";
import { AppHealthStatusBanner } from "@/components/admin/health/AppHealthStatusBanner";

const REFRESH_INTERVAL_MS = 30000;

export function HealthPage() {
    const [dataPromise, setDataPromise] = useState(() => getHealthDataAction());

    useEffect(() => {
        const id = setInterval(() => setDataPromise(getHealthDataAction()), REFRESH_INTERVAL_MS);
        return () => clearInterval(id);
    }, []);

    const { result, overall } = use(dataPromise);

    const checkedAt = new Date(result.checkedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
    });

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                        System Health
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        Last checked: {checkedAt}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <AppHealthStatusBanner result={result} overall={overall} />
            </div>

            <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Services
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.services.map((service) => (
                    <HealthStatusCard key={service.name} result={service} />
                ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                Auto-refreshes every 30 seconds.
            </p>
        </div>
    );
}
