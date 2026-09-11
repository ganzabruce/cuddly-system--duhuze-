"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLAN_IDS,
  PLANS,
  SUBSCRIPTION_STATUSES,
} from "@/lib/constants/billing/constants";
import type { BillingPeriod, PlanId, SubscriptionStatus } from "@/types/billing";
import { assignUserSubscriptionAction } from "@/actions/admin/users";

type UserSubscriptionCardProps = {
  userId: number;
  currentPlanId: PlanId;
  currentPlanLabel: string;
  currentStatus: SubscriptionStatus | "free";
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
  latestNotes: string | null;
};

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

const BILLING_PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function UserSubscriptionCard({
  userId,
  currentPlanId,
  currentPlanLabel,
  currentStatus,
  currentPeriodEnd,
  gracePeriodEndsAt,
  latestNotes,
}: UserSubscriptionCardProps) {
  const router = useRouter();
  const [planId, setPlanId] = useState<PlanId>(currentPlanId);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [periodEnd, setPeriodEnd] = useState(toDateInputValue(currentPeriodEnd));
  const [graceEnd, setGraceEnd] = useState(toDateInputValue(gracePeriodEndsAt));
  const [notes, setNotes] = useState(latestNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [trialPlan, setTrialPlan] = useState<"standard" | "premium">("standard");
  const [trialDays, setTrialDays] = useState<number>(30);
  const [isGranting, setIsGranting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await assignUserSubscriptionAction({
        userId,
        planId,
        billingPeriod,
        status,
        currentPeriodEnd: periodEnd || null,
        gracePeriodEndsAt: graceEnd || null,
        notes: notes.trim() || null,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Failed to save subscription");
      }

      toast.success("Subscription updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save subscription",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Billing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current plan: {currentPlanLabel} ({currentStatus})
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="billing-plan">Plan</Label>
          <Select value={planId} onValueChange={(value) => setPlanId(value as PlanId)}>
            <SelectTrigger id="billing-plan" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {PLANS[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-period">Billing period</Label>
          <Select value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}>
            <SelectTrigger id="billing-period" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILLING_PERIODS.map((bp) => (
                <SelectItem key={bp.value} value={bp.value}>
                  {bp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as SubscriptionStatus)}>
            <SelectTrigger id="billing-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_STATUSES.map((nextStatus) => (
                <SelectItem key={nextStatus} value={nextStatus}>
                  {nextStatus}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-period-end">Current period end</Label>
          <Input
            id="billing-period-end"
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-grace-end">Grace period ends</Label>
          <Input
            id="billing-grace-end"
            type="date"
            value={graceEnd}
            onChange={(event) => setGraceEnd(event.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-notes">Notes</Label>
          <Textarea
            id="billing-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Internal note for this billing override"
          />
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-3 text-sm font-medium text-foreground">Quick trial grant</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="trial-plan">Plan</Label>
            <Select value={trialPlan} onValueChange={(v) => setTrialPlan(v as "standard" | "premium")}>
              <SelectTrigger id="trial-plan" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trial-days">Duration</Label>
            <Select value={String(trialDays)} onValueChange={(v) => setTrialDays(Number(v))}>
              <SelectTrigger id="trial-days" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 14, 30, 60, 90].map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            disabled={isGranting}
            onClick={async () => {
              setIsGranting(true);
              try {
                const periodEnd = new Date();
                periodEnd.setDate(periodEnd.getDate() + trialDays);
                const result = await assignUserSubscriptionAction({
                  userId,
                  planId: trialPlan,
                  billingPeriod: "monthly",
                  status: "active",
                  currentPeriodEnd: periodEnd.toISOString().slice(0, 10),
                  gracePeriodEndsAt: null,
                  notes: `Quick trial: ${trialDays} days ${trialPlan}`,
                });
                if (!result.success) throw new Error(result.error ?? "Failed");
                toast.success("Trial granted");
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to grant trial");
              } finally {
                setIsGranting(false);
              }
            }}
          >
            {isGranting ? "Granting..." : "Grant trial"}
          </Button>
        </div>
      </div>

      <div className="flex justify-end border-t border-border px-5 py-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save subscription"}
        </Button>
      </div>
    </div>
  );
}
