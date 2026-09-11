"use client";

import { Button } from "@/components/ui/button";
import { PlanReviewCard } from "@/components/billing/checkout/PlanReviewCard";
import type { BillingPeriod, CheckoutCurrency, PlanId } from "@/types/billing";

interface PlanReviewStepProps {
    planId: PlanId;
    period: BillingPeriod;
    currency: CheckoutCurrency;
    onContinue: () => void;
}

export function PlanReviewStep({ planId, period, currency, onContinue }: PlanReviewStepProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-foreground">Review your plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Confirm your plan and billing preferences.
                </p>
            </div>

            <PlanReviewCard planId={planId} period={period} currency={currency} />

            <Button onClick={onContinue}>Continue to payment</Button>
        </div>
    );
}
