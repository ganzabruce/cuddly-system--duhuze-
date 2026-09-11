import { Suspense } from "react";
import { getOverviewData } from "@/actions/admin/overview";
import { OverviewStatsSection } from "@/components/admin/overview/OverviewStatsSection";
import { OverviewHealthSection } from "@/components/admin/overview/OverviewHealthSection";
import { OverviewStatsSkeleton } from "@/components/skeletons/OverviewStatsSkeleton";
import { OverviewHealthSkeleton } from "@/components/skeletons/OverviewHealthSkeleton";

export default function AdminOverviewRoute() {
    const dataPromise = getOverviewData();

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                        Platform Overview
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
                <div className="flex flex-col gap-4 xl:col-span-2 xl:gap-6">
                    <Suspense fallback={<OverviewStatsSkeleton />}>
                        <OverviewStatsSection dataPromise={dataPromise} />
                    </Suspense>
                </div>

                <div className="flex flex-col gap-4 md:gap-5">
                    <Suspense fallback={<OverviewHealthSkeleton />}>
                        <OverviewHealthSection dataPromise={dataPromise} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
