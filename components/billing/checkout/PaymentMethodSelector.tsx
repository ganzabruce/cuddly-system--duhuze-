"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/types/billing";

interface PaymentMethodOption {
  id: PaymentMethodType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "mtn_momo",
    label: "MTN MoMo",
    description: "Pay with MTN Mobile Money",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-warning text-xs font-bold leading-none text-warning-foreground">
        MTN
      </div>
    ),
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    description: "Pay with Airtel Money",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive text-xs font-bold leading-none text-destructive-foreground">
        Airtel
      </div>
    ),
  },
  {
    id: "card",
    label: "Card",
    description: "Pay with Visa, Mastercard",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
          <rect x="0.5" y="0.5" width="19" height="13" rx="2" stroke="currentColor" strokeOpacity="0.5" />
          <rect x="0" y="3" width="20" height="3" fill="currentColor" fillOpacity="0.6" />
          <rect x="2" y="9" width="6" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    ),
  },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  cardDisabled?: boolean;
}

export function PaymentMethodSelector({
  selected,
  onChange,
  cardDisabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
      {PAYMENT_METHODS.filter((method) => !(method.id === "card" && cardDisabled)).map((method) => {
        const isActive = selected === method.id;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(method.id)}
            className={cn(
              "group flex w-full items-center gap-4 rounded-md border p-4 text-left transition-all duration-200",
              isActive
                ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-muted-foreground/30",
            )}
          >
            <div className={cn("shrink-0 transition-transform duration-200", isActive && "scale-105")}>
              {method.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-foreground/80")}>
                {method.label}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">{method.description}</p>
            </div>
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                isActive
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 group-hover:border-muted-foreground/50",
              )}
            >
              {isActive && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-primary-foreground">
                  <path d="M2 5L4.2 7.5L8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
