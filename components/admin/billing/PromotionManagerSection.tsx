"use client";

import { use } from "react";
import type { getBillingPageDataAction } from "@/actions/admin/billing";
import { PromotionManagerCard } from "@/components/admin/billing/PromotionManagerCard";

export function PromotionManagerSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getBillingPageDataAction>;
}) {
  const { activePromotion } = use(dataPromise);

  return <PromotionManagerCard activePromotion={activePromotion} />;
}
