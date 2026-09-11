"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, MinusIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import type { ActivePromotion } from "@/types/billing";

export function Pricing({ activePromotion }: { activePromotion?: ActivePromotion | null }) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const t = useTranslations("marketing");

  return (
    <div className="flex w-full flex-col gap-10">
      {/* ── Billing toggle ── */}
      {!activePromotion && (
        <div className="flex flex-col items-center gap-2">
          <Tabs
            value={billing}
            onValueChange={(v) => setBilling(v === "yearly" ? "yearly" : "monthly")}
          >
            <TabsList className="inline-flex h-11 gap-1 rounded-md bg-muted px-1">
              <TabsTrigger
                value="monthly"
                className="h-[calc(100%-4px)] rounded-md px-5 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
              >
                {t("pricingSection.monthly")}
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="h-[calc(100%-4px)] rounded-md px-5 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-sm"
              >
                {t("pricingSection.yearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Save 20% badge + billing note */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {billing === "yearly"
                ? t("pricingSection.billedAnnually")
                : t("pricingSection.billedMonthly")}
            </p>
            {billing === "yearly" ? (
              <span className="inline-flex items-center rounded-md bg-success/12 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-success-deep dark:text-success">
                {t("pricingSection.save20")}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Plan cards ── */}
      <div className="grid w-full grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {PLAN_IDS.map((planId) => (
          <PlanCard key={planId} planId={planId} billing={billing} activePromotion={activePromotion} />
        ))}
      </div>

      {/* ── Enterprise banner ── */}
      <EnterpriseBanner />
    </div>
  );
}

function PlanCard({ planId, billing, activePromotion }: { planId: PlanId; billing: BillingPeriod; activePromotion?: ActivePromotion | null }) {
  const plan = PLANS[planId];
  const features = getPlanCardFeatures(planId);
  const isPopular = plan.marketing.popular;
  const isFree = planId === "free";
  const hasPromotion = !!activePromotion && !isFree && isPromoCoveredPlan(activePromotion.plan as PlanId, planId);
  const t = useTranslations("marketing");

  const price = isFree ? "Free" : hasPromotion ? formatRwfZero() : formatPlanPrice(planId, billing, "RWF");
  const monthlyEquiv = !isFree && !hasPromotion && billing === "yearly" ? formatYearlyMonthlyEquiv(planId) : null;
  const ctaLink = isFree
    ? plan.marketing.checkoutPath
    : `${plan.marketing.checkoutPath}&period=${billing}`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-md border bg-card",
        isPopular
          ? "border-accent shadow-[0_0_0_4px_rgba(213,176,57,0.08),0_4px_20px_rgba(213,176,57,0.12)]"
          : "border-border shadow-sm",
      )}
    >
      {/* Popular pill */}
      {isPopular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className="inline-flex items-center rounded-md bg-accent px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-sm">
            {t("pricingSection.mostPopular")}
          </span>
        </div>
      )}

      {/* ── Card header ── */}
      <div
        className={cn(
          "flex flex-col border-b p-6",
          isPopular ? "border-accent/25 bg-accent-tint/50" : "border-border/60",
        )}
      >
        <div className="flex items-start justify-between">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isPopular ? "text-accent-deep dark:text-accent" : "text-muted-foreground",
            )}
          >
            {plan.name}
          </p>
          {!isFree && !hasPromotion && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
              {billing === "monthly" ? t("pricingSection.perMonth") : t("pricingSection.perYear")}
            </span>
          )}
          {hasPromotion && (
            <span className="inline-flex items-center rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              Free promo
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span
            className={cn(
              "font-display font-bold tracking-tight text-foreground",
              "text-3xl sm:text-4xl",
            )}
          >
            {price}
          </span>
          {hasPromotion && (
            <span className="text-lg font-medium text-muted-foreground/50 line-through">
              {formatPlanPrice(planId, billing, "RWF")}
            </span>
          )}
        </div>

        {/* Sub-price line */}
        <p className="mt-1 text-xs text-muted-foreground/70">
          {hasPromotion
            ? `Free until ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(activePromotion!.endsAt)} — limited promotion`
            : monthlyEquiv
              ? `≈ ${monthlyEquiv}/mo · billed annually`
              : plan.marketing.tagline}
        </p>

        {/* CTA */}
        <Link href={ctaLink} className="mt-5 block">
          <Button
            className="w-full text-sm font-semibold"
            variant={isFree ? "outline" : isPopular ? "default" : "secondary"}
          >
            {plan.marketing.cta}
          </Button>
        </Link>
      </div>

      {/* ── Feature list ── */}
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t("pricingSection.whatsIncluded")}
        </p>

        <div className="flex flex-col gap-2.5">
          {features.active.map((label, i) => (
            <FeatureItem key={`a-${i}`} label={label} active />
          ))}

          {features.inactive.length > 0 && (
            <>
              <div className="my-2 h-px w-full bg-border/50" />
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
            : "font-normal text-muted-foreground line-through decoration-muted-foreground/30",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function EnterpriseBanner() {
  const t = useTranslations("marketing");

  return (
    <div className="flex flex-col items-start justify-between gap-5 rounded-md border border-border bg-muted/40 px-6 py-5 sm:flex-row sm:items-center sm:px-8 sm:py-6">
      <div className="flex flex-col gap-1">
        <Badge variant="muted" className="w-fit uppercase tracking-widest">
          {t("enterprise.badge")}
        </Badge>
        <p className="mt-2 font-display text-lg font-bold text-foreground sm:text-xl">
          {t("enterprise.heading")}
        </p>
        <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">
          {t("enterprise.description")}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <Link href="/contact?subject=Enterprise%20plan">
          <Button className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <EnvelopeIcon className="h-4 w-4" />
            {t("enterprise.contactUs")}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">{t("enterprise.replyNote")}</p>
      </div>
    </div>
  );
}
