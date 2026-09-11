"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { PLANS } from "@/lib/constants/billing/constants";
import type { BillingOverview, PaymentHistoryItem } from "@/types/billing";
import { cn } from "@/lib/utils";
import {
    cancelCurrentSubscriptionAction,
    scheduleDowngradeToStandardAction,
} from "@/actions/billing/actions";

export function BillingClient({ overview }: { overview: BillingOverview }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const entitlements = overview.entitlements;
    const plan = PLANS[entitlements.planId as keyof typeof PLANS];
    const limits = entitlements.limits;
    const usage = entitlements.usage;
    const futureSubscription = overview.futureSubscription;
    const hasFuturePlan = Boolean(futureSubscription);

    const getStatusBadgeVariant = (status: string): React.ComponentProps<typeof Badge>["variant"] => {
        switch (status) {
            case "active":
            case "succeeded":
                return "success";
            case "grace_period":
                return "warning";
            case "pending":
                return "primary";
            case "failed":
            case "canceled":
            case "expired":
            case "refunded":
                return "destructive";
            default:
                return "muted";
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "RWF",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    const currentPaidPlan = entitlements.subscription?.plan;
    const canUpgrade = true;
    const canDowngrade = currentPaidPlan === "premium" && !hasFuturePlan;
    const canCancel = entitlements.planId !== "free" && entitlements.subscription?.status !== "canceled";

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelCurrentSubscriptionAction();
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success("Your current plan will end at the close of this billing period.");
            router.refresh();
        });
    };

    const handleUpgrade = () => {
        router.push("/app/billing/checkout");
    };

    const handleDowngrade = () => {
        startTransition(async () => {
            const result = await scheduleDowngradeToStandardAction();
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success("Your Standard plan is scheduled for the next billing period.");
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* Grace Period Alert */}
            {entitlements.isInGracePeriod && (
                <div className="rounded-md border border-warning/50 bg-warning/10 p-5 text-warning">
                    <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/20">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning-foreground">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-warning-foreground">Grace Period Active</h3>
                            <p className="mt-1 text-sm text-warning-foreground/80">
                                Your previous payment attempt failed or your subscription expired.
                                You are currently in a grace period ending on{" "}
                                <span className="font-semibold">
                                    {entitlements.subscription?.gracePeriodEndsAt
                                        ? format(new Date(entitlements.subscription.gracePeriodEndsAt), "MMM d, yyyy")
                                        : ""}
                                </span>.
                                Please update your payment to avoid losing access to premium features.
                            </p>
                            <Button
                                className="mt-4 bg-warning hover:bg-warning/90 text-warning-foreground"
                                onClick={handleUpgrade}
                            >
                                Renew Subscription
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div>
                        <h2 className="m-0 text-base font-semibold text-foreground">Current Plan</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {entitlements.planId === "free"
                                ? "You are currently on the Free tier."
                                : entitlements.subscription?.status === "canceled"
                                    ? "Your current paid access will end at period close."
                                    : "You have an active paid subscription."}
                        </p>
                    </div>
                    <Badge
                        variant={getStatusBadgeVariant(entitlements.subscription?.status || "active")}
                        className="rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                    >
                        {entitlements.subscription?.status || "active"}
                    </Badge>
                </div>

                <div className="grid gap-6 p-4 sm:grid-cols-2">
                    {/* Plan Details */}
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">{plan.name}</p>
                                {entitlements.planId !== "free" && entitlements.subscription && (
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {entitlements.subscription.billingCycle} Billing
                                    </p>
                                )}
                            </div>
                        </div>

                        {entitlements.subscription?.currentPeriodEnd && (
                            <p className="text-sm text-muted-foreground">
                                Current billing period ends on{" "}
                                <span className="font-medium text-foreground">
                                    {entitlements.subscription.currentPeriodEnd
                                        ? format(new Date(entitlements.subscription.currentPeriodEnd), "MMM d, yyyy")
                                        : ""}
                                </span>
                            </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2">
                            {entitlements.planId === "free" ? (
                                <Button onClick={handleUpgrade}>Upgrade Plan</Button>
                            ) : (
                                <>
                                    <Button onClick={handleUpgrade} disabled={!canUpgrade}>
                                        Upgrade Plan
                                    </Button>
                                    {currentPaidPlan === "premium" && (
                                        <Button
                                            variant="outline"
                                            onClick={handleDowngrade}
                                            disabled={!canDowngrade || isPending}
                                        >
                                            {isPending ? "Scheduling..." : "Schedule Standard"}
                                        </Button>
                                    )}
                                    {canCancel && (
                                        <Button
                                            variant="ghost"
                                            onClick={handleCancel}
                                            disabled={isPending}
                                        >
                                            {isPending ? "Canceling..." : "Cancel Current Plan"}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                        {hasFuturePlan && futureSubscription && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                You already have a pending {PLANS[futureSubscription.plan].name} plan scheduled
                                for {format(new Date(futureSubscription.currentPeriodStart), "MMM d, yyyy")}.
                            </p>
                        )}
                    </div>

                    {/* Usage Quotas */}
                    <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Plan Usage
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1.5 flex items-center justify-between text-sm">
                                    <span className="font-medium text-foreground">Active Events</span>
                                    <span className="text-muted-foreground">
                                        {usage.activePublishedEvents} /{" "}
                                        {limits.maxActiveEvents === null ? "Unlimited" : limits.maxActiveEvents}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-md bg-border">
                                    <div
                                        className={cn(
                                            "h-full rounded-md transition-all duration-500",
                                            usage.remainingActiveEvents === 0
                                                ? "bg-destructive"
                                                : limits.maxActiveEvents &&
                                                    usage.activePublishedEvents / limits.maxActiveEvents > 0.8
                                                    ? "bg-warning"
                                                    : "bg-primary"
                                        )}
                                        style={{
                                            width:
                                                limits.maxActiveEvents === null
                                                    ? "100%"
                                                    : `${Math.min((usage.activePublishedEvents / limits.maxActiveEvents) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                {usage.remainingActiveEvents === 0 && limits.maxActiveEvents !== null && (
                                    <p className="mt-2 text-xs text-destructive">
                                        You have reached your active event limit. Upgrade to publish more events simultaneously.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Queued Plan */}
            {futureSubscription && (
                <div className="rounded-md border border-border bg-card">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                            <h2 className="m-0 text-base font-semibold text-foreground">Queued Plan</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {futureSubscription.source === "carryover"
                                    ? "Your remaining Standard time will resume after Premium ends."
                                    : `Your ${PLANS[futureSubscription.plan].name} plan is already scheduled.`}
                            </p>
                        </div>
                        <Badge
                            variant="primary"
                            className="rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                        >
                            queued
                        </Badge>
                    </div>

                    <div className="grid gap-4 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                                {PLANS[futureSubscription.plan].name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starts</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                                {format(new Date(futureSubscription.currentPeriodStart), "MMM d, yyyy")}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ends</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                                {format(new Date(futureSubscription.currentPeriodEnd), "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="rounded-md border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                    <h2 className="m-0 text-base font-semibold text-foreground">Payment History</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Your recent transactions</p>
                </div>

                {overview.recentPayments.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm text-muted-foreground">No payment history found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="hidden sm:table-cell">Plan</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overview.recentPayments.map((payment: PaymentHistoryItem) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {format(new Date(payment.createdAt), "h:mm a")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap font-medium">
                                        {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell className="hidden whitespace-nowrap capitalize text-muted-foreground sm:table-cell">
                                        {payment.plan}{" "}
                                        <span className="text-xs lowercase text-muted-foreground/70">
                                            / {payment.billingCycle}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <Badge
                                            variant={getStatusBadgeVariant(payment.status)}
                                            className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                                        >
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
