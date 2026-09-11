import { Skeleton } from "@/components/ui/skeleton";

export function ErrorsSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-72 w-full" />
        </div>
    );
}
