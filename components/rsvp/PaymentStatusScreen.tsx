"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { checkGuestEventPaymentStatusAction } from "@/actions/rsvp/check-payment-status";
import { formatCurrency as formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { formatPhoneForDisplay } from "@/lib/utils/phone";

type PaymentStatus = "pending" | "succeeded" | "failed" | "expired";

interface PaymentStatusScreenProps {
  guestToken: string;
  requestTransactionId: string;
  amount: number;
  currency: string;
  payerPhone?: string | null;
  onRetry: () => void;
  onSuccess?: () => void;
}

export function PaymentStatusScreen({
  guestToken,
  requestTransactionId,
  amount,
  currency,
  payerPhone,
  onRetry,
  onSuccess,
}: PaymentStatusScreenProps) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    const poll = async () => {
      const result = await checkGuestEventPaymentStatusAction(
        guestToken,
        requestTransactionId,
      );
      if (result.status && result.status !== "pending") {
        setStatus(result.status as PaymentStatus);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (result.status === "succeeded") {
          onSuccessRef.current?.();
        } else if (result.status === "failed") {
          toast.error("Payment failed", {
            description: "Your payment could not be processed. Please try again.",
            duration: 8000,
          });
        } else if (result.status === "expired") {
          toast.error("Payment request expired", {
            description: "The payment prompt timed out. Please try again.",
            duration: 8000,
          });
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [guestToken, requestTransactionId]);

  const formatted = formatMoney(amount, currency);
  const displayPhone = payerPhone
    ? formatPhoneForDisplay(payerPhone) || payerPhone
    : null;

  if (status === "succeeded") {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-surface">
          <CheckCircleIcon className="h-6 w-6 text-success-deep" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            Payment confirmed!
          </p>
          <p className="text-sm text-muted-foreground">
            Your RSVP is confirmed. Check your email for details.
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed" || status === "expired") {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive-surface">
          <XCircleIcon className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            {status === "expired" ? "Payment request expired" : "Payment failed"}
          </p>
          <p className="text-sm text-muted-foreground">
            {status === "expired"
              ? "The payment prompt timed out. Please try again."
              : "Your payment could not be processed. Please try again."}
          </p>
        </div>
        <Button onClick={onRetry} className="w-full">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <ClockIcon className="h-6 w-6 animate-pulse text-primary" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Approve the payment prompt sent to{" "}
          <strong className="text-foreground">{displayPhone}</strong>
        </p>
        <p className="text-xs text-muted-foreground">Amount: {formatted}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Waiting for payment confirmation…
        </p>
      </div>
    </div>
  );
}
