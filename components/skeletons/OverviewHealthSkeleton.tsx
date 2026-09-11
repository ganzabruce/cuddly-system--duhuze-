import { Skeleton } from "@/components/ui/skeleton";

export function OverviewHealthSkeleton() {
    return (
        <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-[320px] w-full" />
        </>
    );
}
