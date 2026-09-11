"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BillingPeriod, PlanId } from "@/types/billing";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { OrderSummary } from "./OrderSummary";
import { PlanReviewCard } from "./PlanReviewCard";
import { useCheckout } from "./use-checkout";

const STEPS = [
  { id: 1, label: "Plan" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Confirm" },
] as const;

interface CheckoutFormProps {
  planId: PlanId;
  initialPeriod: BillingPeriod;
  userName: string;
  userEmail: string;
  isCardPaymentEnabled: boolean;
  basePath?: string;
  returnPath?: string;
}

export function CheckoutForm({
  planId,
  initialPeriod,
  userName,
  userEmail,
  isCardPaymentEnabled,
  basePath = "/checkout",
  returnPath = "/pricing",
}: CheckoutFormProps) {
  const router = useRouter();

  const {
    step,
    setStep,
    period,
    setPeriod,
    paymentMethod,
    setPaymentMethod,
    phone,
    setPhone,
    checkoutState,
    formAction,
    isSubmitting,
    paymentStatus,
    plan,
    price,
    currency,
    periodLabel,
    paymentMethodLabel,
    confirmPaymentHint,
    paymentMethodDetail,
    pendingPaymentHint,
    handleNext,
    handleBack,
    isPendingScreen,
  } = useCheckout({
    planId,
    initialPeriod,
    onPeriodChange: (newPeriod) =>
      router.replace(`${basePath}?plan=${planId}&period=${newPeriod}`, { scroll: false }),
  });

  function handlePeriodChange(newPeriod: BillingPeriod) {
    setPeriod(newPeriod);
  }

  if (isPendingScreen) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <Card className="bn-slide p-8 sm:p-12">
          <div className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
            paymentStatus === "succeeded" ? "bg-success-surface" :
            paymentStatus === "failed" ? "bg-destructive-surface" : "bg-primary/10"
          )}>
            {paymentStatus === "succeeded" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : paymentStatus === "failed" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-primary">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </div>
          <h2 className="mt-6 font-display text-xl font-bold text-foreground sm:text-2xl">
            {paymentStatus === "succeeded" ? "Payment successful" :
             paymentStatus === "failed" ? "Payment failed" : "Payment processing"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {paymentStatus === "succeeded" ? "Your subscription has been activated." :
             paymentStatus === "failed" ? "There was an issue processing your payment." :
             pendingPaymentHint}
          </p>
          {paymentStatus === "pending" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Your {plan.name} plan ({price}{periodLabel}) is waiting for authorization.
            </p>
          )}
          <Card className="mt-6 bg-muted/30 p-4 text-left">
            <p className="site-eyebrow">Payment details</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium text-foreground">{paymentMethodLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Payment ID</dt>
                <dd className="font-medium text-foreground">#{checkoutState.payment?.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Request ID</dt>
                <dd className="font-mono text-xs text-foreground">
                  {checkoutState.payment?.requestTransactionId ?? "pending"}
                </dd>
              </div>
            </dl>
          </Card>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {paymentStatus === "failed" && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try again
              </Button>
            )}
            {paymentStatus !== "failed" && (
              <Button variant="outline" onClick={() => router.push(returnPath)}>
                Back to pricing
              </Button>
            )}
            <Button onClick={() => router.push("/app/overview")}>
              Go to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
      <div className="lg:hidden">
        <OrderSummary planId={planId} period={period} currency={currency} />
      </div>

      <div className="lg:col-span-3">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                aria-label={`Step ${s.id}: ${s.label}${s.id < step ? " (completed)" : s.id === step ? " (current)" : ""}`}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  s.id === step
                    ? "bg-primary/10 text-primary"
                    : s.id < step
                      ? "cursor-pointer text-muted-foreground hover:text-foreground"
                      : "cursor-default text-muted-foreground/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                    s.id === step
                      ? "bg-primary text-primary-foreground"
                      : s.id < step
                        ? "bg-success-surface text-success"
                        : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {s.id < step ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.2 7.5L8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px w-6 transition-colors duration-200 sm:w-10", s.id < step ? "bg-success/30" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Plan */}
        {step === 1 && (
          <div className="bn-slide space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Review your plan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm your plan and billing preferences.
              </p>
            </div>

            <PlanReviewCard planId={planId} period={period} currency={currency} />

            <div className="space-y-2">
              <Label className="site-eyebrow">Billing period</Label>
              <Tabs value={period} onValueChange={(v) => handlePeriodChange(v as BillingPeriod)}>
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">
                    Yearly
                    <span className="ml-1.5 text-success">Save 20%</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button size="lg" className="w-full sm:w-auto" onClick={handleNext}>
              Continue to payment
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Button>
          </div>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <div className="bn-slide space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Payment method
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how you&apos;d like to pay.
              </p>
            </div>

            <PaymentMethodSelector
              selected={paymentMethod}
              onChange={setPaymentMethod}
              cardDisabled={!isCardPaymentEnabled}
            />

            {!isCardPaymentEnabled && (
              <p className="rounded-md border border-border/70 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Card payments will appear here once Pesapal checkout is fully configured.
              </p>
            )}

            {paymentMethod !== "card" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout-phone">Phone number</Label>
                  <PhoneInput
                    id="checkout-phone"
                    lockedCountry="RW"
                    defaultValue={phone}
                    onChange={setPhone}
                  />
                </div>
                <div className="flex items-start gap-3 rounded-md border border-primary/15 bg-primary/5 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      You&apos;ll receive a payment prompt
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      A push notification will be sent to{" "}
                      <span className="font-medium text-foreground/70">{phone || "07X XXX XXX"}</span>{" "}
                      to approve the payment of{" "}
                      <span className="font-semibold text-foreground">{price}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 8H3M7 4L3 8l4 4" />
                </svg>
                Back
              </Button>
              <Button size="lg" className="flex-1 sm:flex-none" onClick={handleNext}>
                Review order
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div className="bn-slide space-y-6">
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="planId" value={planId} />
              <input type="hidden" name="billingPeriod" value={period} />
              <input type="hidden" name="currency" value={currency} />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <input type="hidden" name="payerPhone" value={phone} />
              <input type="hidden" name="payerName" value={userName} />

              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Confirm Payment
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review your details before completing your payment.
                </p>
              </div>

              <div className="space-y-3">
                <Card className="flex items-start justify-between p-4">
                  <div>
                    <p className="site-eyebrow">Plan</p>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {plan.name} — {period === "monthly" ? "Monthly" : "Annual"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {price}{periodLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Edit
                  </button>
                </Card>

                <Card className="p-4">
                  <p className="site-eyebrow">Account</p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </Card>

                <Card className="flex items-start justify-between p-4">
                  <div>
                    <p className="site-eyebrow">Payment</p>
                    <p className="mt-1.5 text-sm font-medium text-foreground">{paymentMethodLabel}</p>
                    <p className="text-xs text-muted-foreground">{paymentMethodDetail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Edit
                  </button>
                </Card>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-primary/15 bg-primary/5 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{confirmPaymentHint}</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Processing...
                    </>
                  ) : (
                    "Complete Payment"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="hidden lg:col-span-2 lg:block">
        <div className="lg:sticky lg:top-28">
          <OrderSummary planId={planId} period={period} currency={currency} />
        </div>
      </div>
    </div>
  );
}
