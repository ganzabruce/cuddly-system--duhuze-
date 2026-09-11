import { Suspense } from "react";
import { getBillingPageDataAction } from "@/actions/admin/billing";
import { BillingStatsSection } from "@/components/admin/billing/BillingStatsSection";
import { PromotionManagerSection } from "@/components/admin/billing/PromotionManagerSection";
import { BillingStatsSkeleton, PromotionManagerSkeleton } from "@/components/skeletons/BillingSkeleton";

export default function AdminBillingRoute() {
  const dataPromise = getBillingPageDataAction();

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-foreground">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform revenue overview and signup promotion management.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Suspense fallback={<BillingStatsSkeleton />}>
          <BillingStatsSection dataPromise={dataPromise} />
        </Suspense>
        <Suspense fallback={<PromotionManagerSkeleton />}>
          <PromotionManagerSection dataPromise={dataPromise} />
        </Suspense>
      </div>
    </div>
  );
}
