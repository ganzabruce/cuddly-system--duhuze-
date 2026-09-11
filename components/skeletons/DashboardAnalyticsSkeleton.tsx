import { Skeleton } from "@/components/ui/skeleton";

export function DashboardAnalyticsSkeleton() {
    return (
        <div className="w-full min-w-0 space-y-6">
            <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-md" />
                ))}
            </div>
            <Skeleton className="h-48 rounded-md" />
            <Skeleton className="h-64 rounded-md" />
        </div>
    );
}
