"use client";

import type { BillingPeriod } from "@/types/billing";
import { BillingPeriodToggle } from "@/components/billing/checkout/BillingPeriodToggle";

interface CheckoutHeaderProps {
    planName: string;
    period: BillingPeriod;
    onPeriodChange: (period: BillingPeriod) => void;
}

export function CheckoutHeader({ planName, period, onPeriodChange }: CheckoutHeaderProps) {
    return (
        <div className="rounded-md border border-border bg-card">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">Checkout</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Complete your upgrade to {planName}.
                    </p>
                </div>
                <BillingPeriodToggle value={period} onChange={onPeriodChange} />
            </div>
        </div>
    );
}
