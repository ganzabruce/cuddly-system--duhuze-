"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PLANS, formatPlanPrice } from "@/lib/constants/billing/constants";
import type {
  BillingPeriod,
  CheckoutCurrency,
  PaymentMethodType,
  PlanId,
  CheckoutState,
} from "@/types/billing";
import {
  createCheckoutPaymentAction,
  checkPaymentStatusAction,
} from "@/actions/billing/checkout-actions";

export interface UseCheckoutOptions {
  planId: PlanId;
  initialPeriod: BillingPeriod;
  onPeriodChange?: (period: BillingPeriod) => void;
}

export interface UseCheckoutReturn {
  step: number;
  setStep: (step: number) => void;
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (method: PaymentMethodType) => void;
  phone: string;
  setPhone: (phone: string) => void;
  checkoutState: CheckoutState;
  formAction: (payload: FormData) => void;
  isSubmitting: boolean;
  paymentStatus: string;
  plan: (typeof PLANS)[PlanId];
  price: string;
  currency: CheckoutCurrency;
  periodLabel: string;
  paymentMethodLabel: string;
  confirmPaymentHint: string;
  paymentMethodDetail: string;
  pendingPaymentHint: string;
  handleNext: () => void;
  handleBack: () => void;
  isPendingScreen: boolean;
}

export function useCheckout({
  planId,
  initialPeriod,
  onPeriodChange,
}: UseCheckoutOptions): UseCheckoutReturn {
  const [step, setStep] = useState(1);
  const [period, setPeriodState] = useState<BillingPeriod>(initialPeriod);
  const currency: CheckoutCurrency = "RWF";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("mtn_momo");
  const [phone, setPhone] = useState("");

  const [checkoutState, formAction, isSubmitting] = useActionState<
    CheckoutState,
    FormData
  >(createCheckoutPaymentAction, { status: "idle" });

  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  const setPeriod = useCallback(
    (newPeriod: BillingPeriod) => {
      setPeriodState(newPeriod);
      onPeriodChange?.(newPeriod);
    },
    [onPeriodChange],
  );

  // Payment status polling
  useEffect(() => {
    if (
      checkoutState.status !== "pending" ||
      !checkoutState.payment?.requestTransactionId
    ) {
      return;
    }
    const intervalId = setInterval(async () => {
      if (!checkoutState.payment?.requestTransactionId) return;
      const result = await checkPaymentStatusAction(
        checkoutState.payment.requestTransactionId,
      );
      if (result.status !== "pending") {
        setPaymentStatus(result.status);
        clearInterval(intervalId);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [checkoutState.status, checkoutState.payment]);

  // Redirect handling
  useEffect(() => {
    if (checkoutState.redirectUrl) {
      toast.info("Redirecting to Pesapal...");
      window.location.href = checkoutState.redirectUrl;
    }
  }, [checkoutState.redirectUrl]);

  // Error toast
  useEffect(() => {
    if (checkoutState.status === "error" && checkoutState.message) {
      toast.error(checkoutState.message);
    }
  }, [checkoutState.status, checkoutState.message]);

  // Success / failure toast
  useEffect(() => {
    if (paymentStatus === "succeeded") {
      toast.success("Payment completed successfully.");
    } else if (paymentStatus === "failed") {
      toast.error("Payment failed. Please try again.");
    }
  }, [paymentStatus]);

  const plan = PLANS[planId];
  const price = formatPlanPrice(planId, period, currency);
  const periodLabel = period === "monthly" ? "/mo" : "/yr";
  const paymentMethodLabel =
    paymentMethod === "mtn_momo"
      ? "MTN Mobile Money"
      : paymentMethod === "airtel_money"
        ? "Airtel Money"
        : "Card Payment";
  const confirmPaymentHint =
    paymentMethod === "card"
      ? "You will be redirected to Pesapal to complete your card payment."
      : "You'll receive a prompt on your phone to confirm.";
  const paymentMethodDetail =
    paymentMethod === "card" ? "Processed securely by Pesapal" : `+250${phone}`;
  const pendingPaymentHint =
    checkoutState.payment?.paymentMethod === "card"
      ? "You will be redirected to Pesapal to complete your card payment."
      : "Please authorize the payment prompt sent to your phone.";

  const handleNext = useCallback(() => {
    if (step === 2 && paymentMethod !== "card" && !phone.trim()) return;
    if (step < 3) setStep((s) => s + 1);
  }, [step, paymentMethod, phone]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const isPendingScreen =
    checkoutState.status === "pending" && checkoutState.payment !== undefined;

  return {
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
  };
}
