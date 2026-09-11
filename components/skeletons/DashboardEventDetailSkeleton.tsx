import { Skeleton } from "@/components/ui/skeleton";

export function DashboardEventDetailSkeleton() {
    return (
        <div className="w-full min-w-0 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
                <Skeleton className="h-48 rounded-md" />
                <Skeleton className="h-32 rounded-md" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
            </div>
        </div>
    );
}
