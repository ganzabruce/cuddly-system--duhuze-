import { Skeleton } from "@/components/ui/skeleton";

export function DashboardOverviewSkeleton() {
    return (
        <div className="w-full min-w-0 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-10 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-md" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-5">
                <Skeleton className="h-80 rounded-md xl:col-span-2" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-44 rounded-md" />
                    <Skeleton className="h-44 rounded-md" />
                </div>
            </div>
        </div>
    );
}
