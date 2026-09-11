import { Skeleton } from "@/components/ui/skeleton";

export function DashboardEventsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 rounded-md" />
            ))}
        </div>
    );
}
