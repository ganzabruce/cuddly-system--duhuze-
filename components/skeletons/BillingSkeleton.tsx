import { Skeleton } from "@/components/ui/skeleton";

export function BillingStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function PromotionManagerSkeleton() {
  return <Skeleton className="h-48 w-full" />;
}
