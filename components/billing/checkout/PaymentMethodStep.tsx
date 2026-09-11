"use client";

import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { PaymentMethodSelector } from "@/components/billing/checkout/PaymentMethodSelector";
import type { PaymentMethodType } from "@/types/billing";

interface PaymentMethodStepProps {
    paymentMethod: PaymentMethodType;
    onPaymentMethodChange: (method: PaymentMethodType) => void;
    cardDisabled: boolean;
    phone: string;
    onPhoneChange: (phone: string) => void;
    price: string;
    onBack: () => void;
    onNext: () => void;
}

export function PaymentMethodStep({
    paymentMethod,
    onPaymentMethodChange,
    cardDisabled,
    phone,
    onPhoneChange,
    price,
    onBack,
    onNext,
}: PaymentMethodStepProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-foreground">Payment method</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose how you&apos;d like to pay.
                </p>
            </div>

            <PaymentMethodSelector
                selected={paymentMethod}
                onChange={onPaymentMethodChange}
                cardDisabled={cardDisabled}
            />

            {cardDisabled && (
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
                            onChange={onPhoneChange}
                        />
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
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                You&apos;ll receive a payment prompt
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                A push notification will be sent to{" "}
                                <span className="font-medium text-foreground/70">
                                    {phone || "07X XXX XXX"}
                                </span>{" "}
                                to approve the payment of{" "}
                                <span className="font-semibold text-foreground">{price}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={onNext}>Review order</Button>
            </div>
        </div>
    );
}
