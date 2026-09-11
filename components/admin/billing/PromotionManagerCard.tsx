"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startPromotionAction, stopPromotionAction } from "@/actions/admin/billing";
import type { ActivePromotion } from "@/types/billing";

type SerializedActivePromotion = Omit<ActivePromotion, "startedAt" | "endsAt"> & {
  startedAt: string;
  endsAt: string;
};

type Props = {
  activePromotion: SerializedActivePromotion | null;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function PromotionManagerCard({ activePromotion }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<"standard" | "premium">("standard");
  const [endsAt, setEndsAt] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await startPromotionAction({ slug, plan, endsAt });
      if (!result.success) throw new Error(result.error ?? "Failed");
      toast.success("Promotion started");
      setSlug("");
      setEndsAt("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start promotion");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const result = await stopPromotionAction();
      if (!result.success) throw new Error(result.error ?? "Failed");
      toast.success("Promotion stopped");
      setConfirmStop(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop promotion");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Signup Promotion</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            New signups automatically receive a free trial subscription.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activePromotion
              ? "bg-success-surface text-success-deep"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {activePromotion ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="p-5">
        {activePromotion ? (
          <div className="space-y-4">
            <div className="grid gap-1 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Slug:</span>
                <span className="font-medium text-foreground">{activePromotion.slug}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium capitalize text-foreground">{activePromotion.plan}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Started:</span>
                <span className="font-medium text-foreground">
                  {formatDate(activePromotion.startedAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Ends:</span>
                <span className="font-medium text-foreground">
                  {formatDate(activePromotion.endsAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">By:</span>
                <span className="font-medium text-foreground">{activePromotion.startedByEmail}</span>
              </div>
            </div>

            {confirmStop ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Stop this promotion?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isStopping}
                  onClick={handleStop}
                >
                  {isStopping ? "Stopping..." : "Confirm stop"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmStop(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmStop(true)}>
                Stop promotion
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:flex sm:flex-wrap sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="promo-slug">Slug</Label>
              <Input
                id="promo-slug"
                className="w-full sm:w-44"
                placeholder="summer-2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as "standard" | "premium")}>
                <SelectTrigger id="promo-plan" className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-ends-at">End date</Label>
              <Input
                id="promo-ends-at"
                type="date"
                className="w-full sm:w-44"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
            <Button disabled={isStarting || !slug.trim() || !endsAt} onClick={handleStart}>
              {isStarting ? "Starting..." : "Start promotion"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
