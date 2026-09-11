import { Skeleton } from "@/components/ui/skeleton";

export function DashboardEventGuestsSkeleton() {
    return (
        <div className="w-full min-w-0 space-y-6 pt-4 md:pt-0">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-md" />
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
