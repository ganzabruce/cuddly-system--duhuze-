import { Skeleton } from "@/components/ui/skeleton";

export function DashboardCheckoutSkeleton() {
    return (
        <div className="w-full min-w-0 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-md" />
                ))}
            </div>
        </div>
    );
}
