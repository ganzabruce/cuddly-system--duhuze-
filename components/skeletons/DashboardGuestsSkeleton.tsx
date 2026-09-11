import { Skeleton } from "@/components/ui/skeleton";

export function DashboardGuestsSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}
