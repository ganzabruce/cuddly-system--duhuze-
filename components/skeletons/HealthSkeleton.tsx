import { Skeleton } from "@/components/ui/skeleton";

export function HealthSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card p-4">
        <Skeleton className="h-6 w-40" />
      </div>
      <Skeleton className="mb-6 h-16 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
