import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSettingsSkeleton() {
    return (
        <div className="w-full min-w-0 space-y-6">
            <div className="flex gap-2 rounded-md bg-muted/40 p-1">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-22 rounded-md" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}
