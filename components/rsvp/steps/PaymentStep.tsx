"use client";

import { forwardRef, useImperativeHandle } from "react";
import type { PaymentMethodType } from "@/types/billing";
import type { PaymentBreakdownLine } from "@/types/events";
import { cn } from "@/lib/utils";
import { PaymentDetails } from "../PaymentDetails";
import { OptionalContributionAmountInput } from "../OptionalContributionAmountInput";

export interface PaymentStepHandle {
  validate: () => boolean;
}

export interface PaymentStepProps {
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (value: PaymentMethodType) => void;
  payerPhone: string;
  onPayerPhoneChange: (value: string) => void;
  contributionPaymentInfo?: string | null;
  isOptionalPayment: boolean;
  optionalAmount: number | undefined;
  onOptionalAmountChange: (value: number | undefined) => void;
  suggestedAmount?: number | null;
  paymentBreakdown: PaymentBreakdownLine[];
  totalContribution: number;
  formatCurrency: (amount: number) => string;
  nameValue: string;
  selectedStatus: string;
  additionalGuestCount: number;
  serverErrors?: { payerPhone?: string };
}

export const PaymentStep = forwardRef<PaymentStepHandle, PaymentStepProps>(
  function PaymentStep(
    {
      paymentMethod,
      onPaymentMethodChange,
      payerPhone,
      onPayerPhoneChange,
      contributionPaymentInfo,
      isOptionalPayment,
      optionalAmount,
      onOptionalAmountChange,
      suggestedAmount,
      paymentBreakdown,
      totalContribution,
      formatCurrency,
      nameValue,
      selectedStatus,
      additionalGuestCount,
      serverErrors,
    },
    ref,
  ) {
    useImperativeHandle(ref, () => ({
      validate: () => {
        if (isOptionalPayment && (optionalAmount == null || optionalAmount <= 0)) {
          return true;
        }
        if (!payerPhone.trim()) {
          return false;
        }
        return true;
      },
    }));

    return (
      <div className="space-y-6">
        {isOptionalPayment ? (
          <OptionalContributionAmountInput
            value={optionalAmount}
            onChange={onOptionalAmountChange}
            suggestedAmount={suggestedAmount}
          />
        ) : null}

        {!isOptionalPayment || (optionalAmount != null && optionalAmount > 0) ? (
          <PaymentDetails
            contributionPaymentInfo={contributionPaymentInfo}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={onPaymentMethodChange}
            payerPhone={payerPhone}
            onPayerPhoneChange={onPayerPhoneChange}
          />
        ) : null}

        {serverErrors?.payerPhone ? (
          <p className="text-sm text-destructive">
            {serverErrors.payerPhone}
          </p>
        ) : null}

        {/* Response summary */}
        <div className="overflow-hidden rounded-md border border-border bg-muted/30">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">Response Summary</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{nameValue}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Response</span>
              <span
                className={cn(
                  "font-semibold",
                  selectedStatus === "yes" && "text-success-deep",
                  selectedStatus === "maybe" && "text-warning-deep",
                )}
              >
                {selectedStatus === "yes" ? "Attending" : "Maybe"}
              </span>
            </div>
            {additionalGuestCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Additional guests</span>
                <span className="font-medium text-foreground">+{additionalGuestCount}</span>
              </div>
            )}
            {(paymentBreakdown.length > 1 || paymentBreakdown.some((l) => l.count > 1)) &&
              paymentBreakdown.map((line) => (
                <div key={line.label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {line.label}: {line.count} × {formatCurrency(line.contributionAmount)}
                  </span>
                  <span className="font-medium text-foreground">{formatCurrency(line.subtotalAmount)}</span>
                </div>
              ))}
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium text-foreground">Total contribution</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalContribution)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
