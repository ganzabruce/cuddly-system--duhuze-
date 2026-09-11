"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    PLAN_IDS,
    PLANS,
    formatPlanPrice,
    formatRwfZero,
    formatYearlyMonthlyEquiv,
    getPlanCardFeatures,
    isPromoCoveredPlan,
} from "@/lib/constants/billing/constants";
import type { BillingPeriod, PlanId } from "@/types/billing";
import { BillingPeriodToggle } from "./BillingPeriodToggle";
import type { ActivePromotion } from "@/types/billing";

interface DashboardPlanViewProps {
    currentPlanId: PlanId;
    activePromotion?: ActivePromotion | null;
}

export function DashboardPlanView({ currentPlanId, activePromotion }: DashboardPlanViewProps) {
    const [billing, setBilling] = useState<BillingPeriod>("monthly");

    return (
        <div className="w-full min-w-0">
            {/* Page header card */}
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                            Upgrade your plan
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {activePromotion
                                ? `Limited-time promotion active — get ${PLANS[activePromotion.plan].name} free until ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(activePromotion.endsAt)}.`
                                : "Choose a plan that fits your needs. All prices are in RWF."}
                        </p>
                    </div>
                    {!activePromotion && <BillingPeriodToggle value={billing} onChange={setBilling} />}
                </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLAN_IDS.map((planId) => (
                    <PlanCard
                        key={planId}
                        planId={planId}
                        billing={billing}
                        currentPlanId={currentPlanId}
                        activePromotion={activePromotion}
                    />
                ))}
            </div>
        </div>
    );
}

function PlanCard({
    planId,
    billing,
    currentPlanId,
    activePromotion,
}: {
    planId: PlanId;
    billing: BillingPeriod;
    currentPlanId: PlanId;
    activePromotion?: ActivePromotion | null;
}) {
    const plan = PLANS[planId];
    const features = getPlanCardFeatures(planId);
    const isPopular = plan.marketing.popular;
    const isFree = planId === "free";
    const isCurrent = planId === currentPlanId;
    const hasPromotion = !!activePromotion && !isFree && isPromoCoveredPlan(activePromotion.plan as PlanId, planId) && currentPlanId === "free";

    const price = isFree ? "Free" : hasPromotion ? formatRwfZero() : formatPlanPrice(planId, billing, "RWF");
    const monthlyEquiv =
        !isFree && !hasPromotion && billing === "yearly" ? formatYearlyMonthlyEquiv(planId) : null;
    const ctaHref = isFree
        ? undefined
        : `/app/billing/checkout?plan=${planId}&period=${billing}`;

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-md border bg-card",
                isPopular && !isCurrent
                    ? "border-accent/60"
                    : isCurrent
                      ? "border-primary/50"
                      : "border-border"
            )}
        >
            {/* Card header */}
            <div
                className={cn(
                    "flex flex-col border-b p-5",
                    isCurrent
                        ? "border-primary/15 bg-primary/[0.03]"
                        : isPopular
                          ? "border-accent/20 bg-accent/[0.03]"
                          : "border-border/60"
                )}
            >
                <div className="flex items-start justify-between">
                    <p
                        className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            isPopular && !isCurrent
                                ? "text-accent-deep dark:text-accent"
                                : "text-muted-foreground"
                        )}
                    >
                        {plan.name}
                    </p>
                    <div className="flex items-center gap-2">
                        {isCurrent && (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Current
                            </span>
                        )}
                        {!isFree && !hasPromotion && (
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
                                {billing === "monthly" ? "/mo" : "/yr"}
                            </span>
                        )}
                        {hasPromotion && (
                            <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                                Promo
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {price}
                    </span>
                    {hasPromotion && (
                        <span className="text-base font-medium text-muted-foreground/50 line-through">
                            {formatPlanPrice(planId, billing, "RWF")}
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs text-muted-foreground/70">
                    {hasPromotion
                        ? `Free until ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(activePromotion!.endsAt)} — limited promotion`
                        : monthlyEquiv
                          ? `≈ ${monthlyEquiv}/mo · billed annually`
                          : plan.marketing.tagline}
                </p>

                {isCurrent ? (
                    <Button
                        className="mt-4 w-full text-sm font-semibold"
                        variant="outline"
                        disabled
                    >
                        Current plan
                    </Button>
                ) : isFree ? (
                    <Button
                        className="mt-4 w-full text-sm font-semibold"
                        variant="outline"
                        disabled
                    >
                        Free
                    </Button>
                ) : (
                    <Link href={ctaHref!} className="mt-4 block">
                        <Button
                            className="w-full text-sm font-semibold"
                            variant={hasPromotion ? "default" : isPopular ? "default" : "secondary"}
                        >
                            {hasPromotion ? `Claim ${plan.name} free` : `Upgrade to ${plan.name}`}
                        </Button>
                    </Link>
                )}
            </div>

            {/* Feature list */}
            <div className="flex flex-1 flex-col p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    What&apos;s included
                </p>
                <div className="flex flex-col gap-2">
                    {features.active.map((label, i) => (
                        <FeatureItem key={`a-${i}`} label={label} active />
                    ))}
                    {features.inactive.length > 0 && (
                        <>
                            <div className="my-1.5 h-px w-full bg-border/50" />
                            {features.inactive.map((label, i) => (
                                <FeatureItem key={`n-${i}`} label={label} active={false} />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ label, active }: { label: string; active: boolean }) {
    return (
        <div className={cn("flex items-start gap-2.5", !active && "opacity-35")}>
            {active ? (
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
                <MinusIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span
                className={cn(
                    "text-sm leading-snug",
                    active
                        ? "font-medium text-foreground"
                        : "font-normal text-muted-foreground line-through decoration-muted-foreground/30"
                )}
            >
                {label}
            </span>
        </div>
    );
}
