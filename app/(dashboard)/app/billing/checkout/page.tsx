import { Suspense } from "react";
import { DashboardCheckoutPage } from "@/components/billing/DashboardCheckoutPage";
import { DashboardCheckoutSkeleton } from "@/components/skeletons/DashboardCheckoutSkeleton";
import { getDashboardCheckoutData } from "@/actions/billing/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout | Duhuze RSVP",
    description: "Upgrade your plan.",
};

interface CheckoutPageProps {
    searchParams: Promise<{ plan?: string; period?: string; existing?: string }>;
}

export default async function DashboardCheckoutRoute({ searchParams }: CheckoutPageProps) {
    const { plan, period, existing } = await searchParams;

    return (
        <Suspense fallback={<DashboardCheckoutSkeleton />}>
            <DashboardCheckoutPage dataPromise={getDashboardCheckoutData({ plan, period, existing })} />
        </Suspense>
    );
}
