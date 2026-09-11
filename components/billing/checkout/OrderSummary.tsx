"use client";

import { cn } from "@/lib/utils";
import { PLANS, formatPlanPrice } from "@/lib/constants/billing/constants";
import type { PlanId, BillingPeriod, CheckoutCurrency } from "@/types/billing";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface OrderSummaryProps {
  planId: PlanId;
  period: BillingPeriod;
  currency: CheckoutCurrency;
  className?: string;
}

export function OrderSummary({
  planId,
  period,
  currency,
  className,
}: OrderSummaryProps) {
  const plan = PLANS[planId];
  const price = formatPlanPrice(planId, period, currency);
  const periodLabel = period === "monthly" ? "Monthly" : "Annual";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              {plan.name} Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              {periodLabel} subscription
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="border-t border-border pt-4 space-y-3">
        <p className="site-eyebrow">Order details</p>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {plan.name} — {periodLabel.toLowerCase()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Billed {period === "monthly" ? "every month" : "once per year"}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {price}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border bg-gradient-to-b from-card to-secondary/30 flex-col items-stretch gap-1 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            {price}
          </span>
        </div>
        <p className="text-right text-xs text-muted-foreground">No additional fees</p>
      </CardFooter>
    </Card>
  );
}
