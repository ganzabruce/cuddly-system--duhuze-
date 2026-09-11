import { Skeleton } from "@/components/ui/skeleton";

export function UsersListSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-72 w-full" />
        </div>
    );
}
