"use client";

import { use } from "react";
import type { getDashboardBillingOverview } from "@/actions/billing/dashboard";
import { BillingClient } from "./BillingClient";

export function DashboardBillingPage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardBillingOverview>;
}) {
    const overview = use(dataPromise);

    return <BillingClient overview={overview} />;
}
