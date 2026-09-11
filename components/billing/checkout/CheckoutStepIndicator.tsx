"use client";

import { cn } from "@/lib/utils";

const STEPS = [
    { id: 1, label: "Plan" },
    { id: 2, label: "Payment" },
    { id: 3, label: "Confirm" },
] as const;

interface CheckoutStepIndicatorProps {
    step: number;
}

export function CheckoutStepIndicator({ step }: CheckoutStepIndicatorProps) {
    return (
        <div className="mb-6 flex items-center gap-1">
            {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1">
                    <div
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                            s.id === step
                                ? "bg-primary text-primary-foreground"
                                : s.id < step
                                  ? "bg-success/10 text-success"
                                  : "bg-muted text-muted-foreground"
                        )}
                    >
                        {s.id < step ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            s.id
                        )}
                    </div>
                    <span
                        className={cn(
                            "hidden text-xs sm:inline",
                            s.id <= step ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {s.label}
                    </span>
                    {i < STEPS.length - 1 && (
                        <div
                            className={cn(
                                "mx-1 h-px w-4",
                                s.id < step ? "bg-success/30" : "bg-border"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
