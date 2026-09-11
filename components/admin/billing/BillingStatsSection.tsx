"use client";

import { use } from "react";
import type { getBillingPageDataAction } from "@/actions/admin/billing";
import { BillingStatsCards } from "@/components/admin/billing/BillingStatsCards";

export function BillingStatsSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getBillingPageDataAction>;
}) {
  const { stats } = use(dataPromise);

  return <BillingStatsCards stats={stats} />;
}
