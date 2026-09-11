import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card p-4">
                <Skeleton className="h-6 w-48" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
                <div className="flex flex-col gap-4 xl:col-span-2 xl:gap-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-[320px] w-full" />
                </div>
                <div className="flex flex-col gap-4 md:gap-5">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-[320px] w-full" />
                </div>
            </div>
        </div>
    );
}
