"use server";

import { redirect } from "next/navigation";
import {
    getAdminUserDetail,
    getAdminUserDetailByUsername,
    getUserList,
    suspendUser,
    unsuspendUser,
} from "@/lib/services/admin/user-management";
import type { UserListParams } from "@/types/admin";
import { requireAdmin } from "@/actions/admin/auth";
import { assignAdminSubscription, normalizeSubscriptionDateInput } from "@/lib/services/billing/admin";
import {
    getLatestSubscriptionForUser,
} from "@/lib/services/billing/subscriptions";
import { getResolvedEntitlements } from "@/lib/services/billing/entitlements";
import { logAdminAction } from "@/lib/services/admin/audit-log";
import { PLAN_IDS, SUBSCRIPTION_STATUSES } from "@/lib/constants/billing/constants";

export async function getUserListAction(params: UserListParams) {
    await requireAdmin();
    return getUserList(params);
}

export async function getUserDetailPageDataAction(username: string) {
    await requireAdmin();
    const user = await getAdminUserDetailByUsername(username);
    if (!user) return null;

    const [latestSubscription, entitlements] = await Promise.all([
        getLatestSubscriptionForUser(user.id),
        getResolvedEntitlements(user.id),
    ]);

    return {
        user,
        entitlements,
        latestSubscription: latestSubscription
            ? {
                  status: latestSubscription.status,
                  notes: latestSubscription.notes,
                  currentPeriodEnd: latestSubscription.currentPeriodEnd?.toISOString() ?? null,
                  gracePeriodEndsAt: latestSubscription.gracePeriodEndsAt?.toISOString() ?? null,
              }
            : null,
    };
}

export type UserDetailPageData = Awaited<ReturnType<typeof getUserDetailPageDataAction>>;

export async function getAdminUserDetailAction(
    userId: number
): Promise<Awaited<ReturnType<typeof getAdminUserDetail>>> {
    await requireAdmin();
    return await getAdminUserDetail(userId);
}

export async function suspendUserAction(
    userId: number,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    const admin = await requireAdmin();
    return await suspendUser(userId, admin.email, reason);
}

export async function unsuspendUserAction(
    userId: number
): Promise<void> {
    const admin = await requireAdmin();
    const user = await getAdminUserDetail(userId);
    if (!user) throw new Error("User not found");

    const result = await unsuspendUser(userId, admin.email);
    if (result.success) {
        redirect(`/admin/users/${user.username}`);
    } else {
        throw new Error(result.error);
    }
}

/** Unsuspend from dialog: no redirect, returns result so client can refresh and close dialog. */
export async function unsuspendUserActionFromDialog(
    userId: number
): Promise<{ success: boolean; error?: string }> {
    const admin = await requireAdmin();
    return await unsuspendUser(userId, admin.email);
}

export async function assignUserSubscriptionAction(input: {
    userId: number;
    planId: string;
    billingPeriod: string;
    status: string;
    currentPeriodEnd?: string | null;
    gracePeriodEndsAt?: string | null;
    notes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
    const admin = await requireAdmin();

    if (!PLAN_IDS.includes(input.planId as (typeof PLAN_IDS)[number])) {
        return { success: false, error: "Invalid plan" };
    }

    if (input.billingPeriod !== "monthly" && input.billingPeriod !== "yearly") {
        return { success: false, error: "Invalid billing period" };
    }

    if (!SUBSCRIPTION_STATUSES.includes(input.status as (typeof SUBSCRIPTION_STATUSES)[number])) {
        return { success: false, error: "Invalid subscription status" };
    }

    try {
        const subscription = await assignAdminSubscription(
            input.userId,
            {
                planId: input.planId as "free" | "standard" | "premium",
                billingPeriod: input.billingPeriod as "monthly" | "yearly",
                status: input.status as
                    | "active"
                    | "grace_period"
                    | "canceled"
                    | "expired"
                    | "past_due",
                currentPeriodEnd: normalizeSubscriptionDateInput(input.currentPeriodEnd),
                gracePeriodEndsAt: normalizeSubscriptionDateInput(input.gracePeriodEndsAt),
                notes: input.notes ?? null,
            },
            admin.email,
        );

        await logAdminAction({
            adminEmail: admin.email,
            action: "billing.subscription.assign",
            targetType: "user",
            targetId: String(input.userId),
            details: {
                planId: input.planId,
                billingPeriod: input.billingPeriod,
                status: input.status,
                currentPeriodEnd: input.currentPeriodEnd ?? null,
                gracePeriodEndsAt: input.gracePeriodEndsAt ?? null,
                notes: input.notes ?? null,
                subscriptionId: subscription?.id ?? null,
            },
        });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to assign subscription",
        };
    }
}
