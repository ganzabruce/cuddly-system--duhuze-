"use client";

import { cn } from "@/lib/utils";
import { PLANS, formatPlanPrice } from "@/lib/constants/billing/constants";
import type { PlanId, BillingPeriod, CheckoutCurrency } from "@/types/billing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@heroicons/react/24/outline";

interface PlanReviewCardProps {
  planId: PlanId;
  period: BillingPeriod;
  currency: CheckoutCurrency;
  className?: string;
}

export function PlanReviewCard({
  planId,
  period,
  currency,
  className,
}: PlanReviewCardProps) {
  const plan = PLANS[planId];
  const price = formatPlanPrice(planId, period, currency);
  const periodLabel = period === "monthly" ? "/mo" : "/yr";

  return (
    <Card className={cn("border-2 border-primary/30 p-6 sm:p-8", className)}>
      <div className="flex items-center gap-3">
        <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {plan.name}
        </h3>
        <Badge variant="primary" className="uppercase tracking-widest">
          {period === "yearly" ? "Annual" : "Monthly"}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {price}
        </span>
        <span className="text-sm text-muted-foreground">{periodLabel}</span>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="site-eyebrow">What&apos;s included</p>
        <ul className="mt-3 space-y-2.5">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium leading-5 text-foreground/80">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
