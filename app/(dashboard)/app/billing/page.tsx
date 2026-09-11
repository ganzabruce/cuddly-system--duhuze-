import { Suspense } from "react";
import { DashboardBillingPage } from "@/components/billing/DashboardBillingPage";
import { DashboardBillingSkeleton } from "@/components/skeletons/DashboardBillingSkeleton";
import { DashboardPageHeader } from "@/components/layout/DashboardPageHeader";
import { getDashboardBillingOverview } from "@/actions/billing/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Billing | Duhuze RSVP",
    description: "Manage your subscription and billing details.",
};

export default function BillingPage() {
    return (
        <div className="w-full min-w-0">
            <DashboardPageHeader
                title="Billing & Subscription"
                subtitle="Manage your active plan, queued plan changes, and payment history."
            />
            <Suspense fallback={<DashboardBillingSkeleton />}>
                <DashboardBillingPage dataPromise={getDashboardBillingOverview()} />
            </Suspense>
        </div>
    );
}
