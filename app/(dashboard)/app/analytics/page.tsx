import { Suspense } from "react";
import { AnalyticsPage } from "@/components/events/analytics/AnalyticsPage";
import { DashboardAnalyticsSkeleton } from "@/components/skeletons/DashboardAnalyticsSkeleton";
import { getDashboardAnalyticsData } from "@/actions/events/dashboard";
import { getDateRange, endOfDay } from "@/lib/constants/events/analytics-date-range";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics | Duhuze RSVP",
};

type AnalyticsPageSearchParams = Promise<{
    range?: string;
    start?: string;
    end?: string;
}>;

export default async function DashboardAnalyticsPage({
    searchParams,
}: {
    searchParams: AnalyticsPageSearchParams;
}) {
    const { range, start, end } = await searchParams;
    const dateRange = getDateRange(range, start, end);
    const dataPromise = getDashboardAnalyticsData({
        startDate: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
        endDate: dateRange.endDate ? endOfDay(dateRange.endDate)?.toISOString() : undefined,
    });

    return (
        <Suspense fallback={<DashboardAnalyticsSkeleton />}>
            <AnalyticsPage
                key={`${range}-${start}-${end}`}
                range={range}
                start={start}
                end={end}
                initialDataPromise={dataPromise}
            />
        </Suspense>
    );
}
