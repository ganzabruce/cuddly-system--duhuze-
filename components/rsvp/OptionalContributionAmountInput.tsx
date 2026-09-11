"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OptionalContributionAmountInput({
  value,
  onChange,
  suggestedAmount,
  disabled,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  suggestedAmount?: number | null;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="optionalAmountInput" className="text-sm font-medium text-foreground">
        Contribution amount <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Input
        id="optionalAmountInput"
        type="number"
        min={0}
        step={1}
        value={value ?? ""}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? undefined : Math.max(0, parsed));
        }}
        placeholder={suggestedAmount != null ? String(suggestedAmount) : "Enter amount"}
        disabled={disabled}
        className="h-11"
      />
      <p className="text-xs text-muted-foreground">
        Leave empty to skip contributing, or enter an amount you&apos;d like to contribute.
      </p>
    </div>
  );
}
