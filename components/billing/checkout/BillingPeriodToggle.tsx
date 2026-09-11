"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { BillingPeriod } from "@/types/billing";

interface BillingPeriodToggleProps {
    value: BillingPeriod;
    onChange: (value: BillingPeriod) => void;
}

export function BillingPeriodToggle({ value, onChange }: BillingPeriodToggleProps) {
    return (
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <Tabs
                value={value}
                onValueChange={(v) => onChange(v === "yearly" ? "yearly" : "monthly")}
            >
                <TabsList className="inline-flex h-9 gap-1 rounded-md bg-muted px-1">
                    <TabsTrigger
                        value="monthly"
                        className={cn(
                            "h-[calc(100%-4px)] rounded-md px-4 py-1.5 text-xs font-medium outline-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        )}
                    >
                        Monthly
                    </TabsTrigger>
                    <TabsTrigger
                        value="yearly"
                        className={cn(
                            "h-[calc(100%-4px)] rounded-md px-4 py-1.5 text-xs font-medium outline-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        )}
                    >
                        Yearly
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground">
                    {value === "yearly"
                        ? "Billed annually · All prices in RWF"
                        : "Billed monthly · All prices in RWF"}
                </p>
                {value === "yearly" ? (
                    <span className="inline-flex items-center rounded-md bg-success/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-deep dark:text-success">
                        Save 20%
                    </span>
                ) : null}
            </div>
        </div>
    );
}
