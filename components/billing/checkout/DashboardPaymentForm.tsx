"use client";

import { useRouter } from "next/navigation";
import type { BillingPeriod, PlanId } from "@/types/billing";
import { useCheckout } from "@/components/billing/checkout/use-checkout";
import { CheckoutHeader } from "@/components/billing/checkout/CheckoutHeader";
import { CheckoutStepIndicator } from "@/components/billing/checkout/CheckoutStepIndicator";
import { PlanReviewStep } from "@/components/billing/checkout/PlanReviewStep";
import { PaymentMethodStep } from "@/components/billing/checkout/PaymentMethodStep";
import { ConfirmPaymentStep } from "@/components/billing/checkout/ConfirmPaymentStep";
import { PaymentStatusView } from "@/components/billing/checkout/PaymentStatusView";
import { OrderSummary } from "@/components/billing/checkout/OrderSummary";

interface DashboardPaymentFormProps {
    planId: PlanId;
    initialPeriod: BillingPeriod;
    userName: string;
    userEmail: string;
    isCardPaymentEnabled: boolean;
}

export function DashboardPaymentForm({
    planId,
    initialPeriod,
    userName,
    userEmail,
    isCardPaymentEnabled,
}: DashboardPaymentFormProps) {
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
            router.replace(`/app/billing/checkout?plan=${planId}&period=${newPeriod}`, {
                scroll: false,
            }),
    });

    const header = <CheckoutHeader planName={plan.name} period={period} onPeriodChange={setPeriod} />;

    if (isPendingScreen && checkoutState.payment) {
        return (
            <div className="space-y-6">
                {header}
                <PaymentStatusView
                    planId={planId}
                    period={period}
                    currency={currency}
                    planName={plan.name}
                    price={price}
                    periodLabel={periodLabel}
                    paymentStatus={paymentStatus}
                    paymentMethodLabel={paymentMethodLabel}
                    checkoutState={checkoutState}
                    pendingPaymentHint={pendingPaymentHint}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {header}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <CheckoutStepIndicator step={step} />

                    {step === 1 && (
                        <PlanReviewStep
                            planId={planId}
                            period={period}
                            currency={currency}
                            onContinue={handleNext}
                        />
                    )}

                    {step === 2 && (
                        <PaymentMethodStep
                            paymentMethod={paymentMethod}
                            onPaymentMethodChange={setPaymentMethod}
                            cardDisabled={!isCardPaymentEnabled}
                            phone={phone}
                            onPhoneChange={setPhone}
                            price={price}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}

                    {step === 3 && (
                        <ConfirmPaymentStep
                            planId={planId}
                            period={period}
                            currency={currency}
                            paymentMethod={paymentMethod}
                            phone={phone}
                            userName={userName}
                            userEmail={userEmail}
                            price={price}
                            periodLabel={periodLabel}
                            paymentMethodLabel={paymentMethodLabel}
                            paymentMethodDetail={paymentMethodDetail}
                            confirmPaymentHint={confirmPaymentHint}
                            formAction={formAction}
                            isSubmitting={isSubmitting}
                            onEditPlan={() => setStep(1)}
                            onEditPayment={() => setStep(2)}
                            onBack={handleBack}
                        />
                    )}
                </div>

                {/* Order summary — desktop sticky */}
                <div className="hidden lg:col-span-1 lg:block">
                    <div className="lg:sticky lg:top-24">
                        <OrderSummary planId={planId} period={period} currency={currency} />
                    </div>
                </div>

                {/* Order summary — mobile */}
                <div className="lg:hidden">
                    <OrderSummary planId={planId} period={period} currency={currency} />
                </div>
            </div>
        </div>
    );
}
