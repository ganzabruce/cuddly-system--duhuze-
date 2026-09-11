"use client";

import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { PaymentMethodSelector } from "@/components/billing/checkout/PaymentMethodSelector";
import type { PaymentMethodType } from "@/types/billing";

export function PaymentDetails({
  contributionPaymentInfo,
  paymentMethod,
  onPaymentMethodChange,
  payerPhone,
  onPayerPhoneChange,
  disabled = false,
}: {
  contributionPaymentInfo?: string | null;
  paymentMethod?: PaymentMethodType;
  onPaymentMethodChange?: (value: PaymentMethodType) => void;
  payerPhone?: string;
  onPayerPhoneChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      {onPaymentMethodChange ? (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Payment method
          </Label>
          <PaymentMethodSelector
            selected={paymentMethod ?? "mtn_momo"}
            onChange={onPaymentMethodChange}
            cardDisabled
          />
        </div>
      ) : null}

      {onPayerPhoneChange ? (
        <div className="space-y-2">
          <Label htmlFor="payerPhone" className="text-sm font-medium text-foreground">
            Mobile money phone number <span className="text-destructive">*</span>
          </Label>
          <PhoneInput
            id="payerPhone"
            name="payerPhone"
            lockedCountry="RW"
            defaultValue={payerPhone}
            onChange={onPayerPhoneChange}
            required
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Enter your MTN MoMo or Airtel Money number.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Payment info</Label>
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            {contributionPaymentInfo?.trim()
              ? contributionPaymentInfo
              : "Payment instructions will be provided by the organizer."}
          </div>
        </div>
      )}
    </>
  );
}
