"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BillingPeriod, CheckoutCurrency, PaymentMethodType, PlanId } from "@/types/billing";
import { PLANS } from "@/lib/constants/billing/constants";

interface ConfirmPaymentStepProps {
    planId: PlanId;
    period: BillingPeriod;
    currency: CheckoutCurrency;
    paymentMethod: PaymentMethodType;
    phone: string;
    userName: string;
    userEmail: string;
    price: string;
    periodLabel: string;
    paymentMethodLabel: string;
    paymentMethodDetail: string;
    confirmPaymentHint: string;
    formAction: (payload: FormData) => void;
    isSubmitting: boolean;
    onEditPlan: () => void;
    onEditPayment: () => void;
    onBack: () => void;
}

export function ConfirmPaymentStep({
    planId,
    period,
    currency,
    paymentMethod,
    phone,
    userName,
    userEmail,
    price,
    periodLabel,
    paymentMethodLabel,
    paymentMethodDetail,
    confirmPaymentHint,
    formAction,
    isSubmitting,
    onEditPlan,
    onEditPayment,
    onBack,
}: ConfirmPaymentStepProps) {
    const plan = PLANS[planId];

    return (
        <div className="space-y-6">
            <form action={formAction} className="space-y-6">
                <input type="hidden" name="planId" value={planId} />
                <input type="hidden" name="billingPeriod" value={period} />
                <input type="hidden" name="currency" value={currency} />
                <input type="hidden" name="paymentMethod" value={paymentMethod} />
                <input type="hidden" name="payerPhone" value={phone} />
                <input type="hidden" name="payerName" value={userName} />

                <div>
                    <h2 className="text-base font-semibold text-foreground">Confirm payment</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review your details before completing your payment.
                    </p>
                </div>

                <div className="space-y-3">
                    <Card className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Plan
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-foreground">
                                {plan.name} — {period === "monthly" ? "Monthly" : "Annual"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {price}
                                {periodLabel}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onEditPlan}
                            className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            Edit
                        </button>
                    </Card>

                    <Card className="p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Account
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </Card>

                    <Card className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Payment
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-foreground">
                                {paymentMethodLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">{paymentMethodDetail}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onEditPayment}
                            className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            Edit
                        </button>
                    </Card>
                </div>

                <div className="flex items-start gap-3 rounded-md border border-primary/15 bg-primary/5 p-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-primary"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {confirmPaymentHint}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={onBack}>
                        Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                Processing...
                            </>
                        ) : (
                            "Complete payment"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
