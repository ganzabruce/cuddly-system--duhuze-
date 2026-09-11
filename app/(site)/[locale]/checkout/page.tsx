import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { PLANS } from "@/lib/constants/billing/constants";
import type { PlanId, BillingPeriod } from "@/types/billing";
import { env } from "@/lib/env";
import { getCheckoutContextAction, claimPromotionAction } from "@/actions/billing/actions";
import { CheckoutForm } from "@/components/billing/checkout/CheckoutForm";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("checkout.title"),
    description: t("checkout.description"),
    alternates: localeAlternates("/checkout"),
  };
}

const VALID_PLANS = new Set<string>(["standard", "premium"]);
const VALID_PERIODS = new Set<string>(["monthly", "yearly"]);

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string; period?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { plan, period } = await searchParams;
  const t = await getTranslations("contact");

  if (!plan || !VALID_PLANS.has(plan)) {
    redirect("/pricing");
  }

  const planId = plan as PlanId;

  // Require authentication
  const user = await getCurrentUser();
  if (!user) {
    const checkoutUrl = `/checkout?plan=${planId}${period ? `&period=${period}` : ""}`;
    redirect(`/login?redirect_url=${encodeURIComponent(checkoutUrl)}`);
  }

  if (user.status === "suspended") {
    redirect("/suspended");
  }

  // For regular checkout, period is required before we can resolve intent
  if (!period || !VALID_PERIODS.has(period)) {
    redirect("/pricing");
  }

  const billingPeriod = period as BillingPeriod;

  const { futurePaidSubscription, intent } = await getCheckoutContextAction(
    user.id,
    planId,
    billingPeriod,
  );

  if (futurePaidSubscription) {
    redirect("/app/billing");
  }
  if (intent.type === "promo_grant") {
    await claimPromotionAction(user.id, intent);
    redirect("/app/billing");
  }
  if (intent.type === "blocked") {
    redirect(`/app/billing?toast=${encodeURIComponent(intent.reason)}`);
  }

  const planDef = PLANS[planId];
  const isCardPaymentEnabled = Boolean(
    env.PESAPAL_BASE_URL &&
      env.PESAPAL_CONSUMER_KEY &&
      env.PESAPAL_CONSUMER_SECRET &&
      env.PESAPAL_NOTIFICATION_ID,
  );

  return (
    <section className="relative min-h-[60vh] bg-background pb-16 pt-24 sm:min-h-[80vh] sm:pt-28 lg:pb-24">
      <HeroPattern />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }} />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <div className="bn-slide flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("checkout.badge")}
            </span>
          </div>
          <h1 className="bn-slide bn-d1 mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("checkout.heading")}{" "}
            <span className="font-accent italic font-normal text-primary">
              {planDef.name}
            </span>
          </h1>
        </div>

        <div className="bn-slide bn-d2">
          <CheckoutForm
            planId={planId}
            initialPeriod={billingPeriod}
            userName={user.name}
            userEmail={user.email}
            isCardPaymentEnabled={isCardPaymentEnabled}
          />
        </div>
      </div>
    </section>
  );
}
