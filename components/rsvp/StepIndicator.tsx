"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@heroicons/react/24/outline";

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: { id: number; label: string }[];
  currentStep: number;
}) {
  return (
    <nav className="mb-6" aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  isActive && "border-primary bg-primary/10 text-foreground",
                  isPast && "border-accent/40 bg-accent-tint text-accent-deep dark:text-accent",
                  !isActive && !isPast && "border-border bg-background text-muted-foreground",
                )}
              >
                {isPast ? (
                  <CheckIcon className="size-3.5 shrink-0" />
                ) : (
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && !isPast && "bg-muted text-muted-foreground",
                    )}
                  >
                    {step.id}
                  </span>
                )}
                <span className="whitespace-nowrap">{step.label}</span>
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors duration-200",
                    isPast ? "bg-accent" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
