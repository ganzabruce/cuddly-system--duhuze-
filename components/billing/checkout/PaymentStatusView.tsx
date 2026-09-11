"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/billing/checkout/OrderSummary";
import type { BillingPeriod, CheckoutCurrency, PlanId } from "@/types/billing";
import type { CheckoutState } from "@/types/billing";

interface PaymentStatusViewProps {
    planId: PlanId;
    period: BillingPeriod;
    currency: CheckoutCurrency;
    planName: string;
    price: string;
    periodLabel: string;
    paymentStatus: string;
    paymentMethodLabel: string;
    checkoutState: CheckoutState;
    pendingPaymentHint: string;
}

export function PaymentStatusView({
    planId,
    period,
    currency,
    planName,
    price,
    periodLabel,
    paymentStatus,
    paymentMethodLabel,
    checkoutState,
    pendingPaymentHint,
}: PaymentStatusViewProps) {
    const router = useRouter();

    if (!checkoutState.payment) return null;

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                {/* Status card */}
                <div className="rounded-md border border-border bg-card p-5">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                paymentStatus === "succeeded"
                                    ? "bg-success/10"
                                    : paymentStatus === "failed"
                                      ? "bg-destructive/10"
                                      : "bg-primary/10"
                            )}
                        >
                            {paymentStatus === "succeeded" ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : paymentStatus === "failed" ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-primary">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                {paymentStatus === "succeeded"
                                    ? "Payment successful"
                                    : paymentStatus === "failed"
                                      ? "Payment failed"
                                      : "Payment processing"}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {paymentStatus === "succeeded"
                                    ? "Your subscription has been activated."
                                    : paymentStatus === "failed"
                                      ? "There was an issue processing your payment."
                                      : pendingPaymentHint}
                            </p>
                            {paymentStatus === "pending" && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Your {planName} plan ({price}
                                    {periodLabel}) is waiting for authorization.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment details */}
                <div className="rounded-md border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-foreground">Payment details</h3>
                    </div>
                    <div className="p-4">
                        <dl className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-muted-foreground">Method</dt>
                                <dd className="font-medium text-foreground">{paymentMethodLabel}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-muted-foreground">Payment ID</dt>
                                <dd className="font-medium text-foreground">
                                    #{checkoutState.payment.id}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-muted-foreground">Request ID</dt>
                                <dd className="font-mono text-xs text-foreground">
                                    {checkoutState.payment.requestTransactionId ?? "pending"}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {paymentStatus === "failed" && (
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Try again
                        </Button>
                    )}
                    {paymentStatus !== "failed" && (
                        <Button
                            variant="outline"
                            onClick={() => router.push("/app/billing/checkout")}
                        >
                            Back to plans
                        </Button>
                    )}
                    <Button onClick={() => router.push("/app/billing")}>
                        Go to billing
                    </Button>
                </div>
            </div>

            {/* Order summary */}
            <div className="hidden lg:col-span-1 lg:block">
                <div className="lg:sticky lg:top-24">
                    <OrderSummary planId={planId} period={period} currency={currency} />
                </div>
            </div>
        </div>
    );
}
