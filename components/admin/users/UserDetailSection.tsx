"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import type { getUserDetailPageDataAction } from "@/actions/admin/users";
import { UserDetailCard } from "@/components/admin/users/UserDetailCard";
import { UserSubscriptionCard } from "@/components/admin/users/UserSubscriptionCard";

export function UserDetailSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getUserDetailPageDataAction>;
}) {
    const data = use(dataPromise);

    if (!data) {
        notFound();
    }

    const { user, entitlements, latestSubscription } = data;

    return (
        <>
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
                <div className="rounded-md border border-border bg-card">
                    <div className="p-5 md:p-6">
                        <UserDetailCard user={user} />
                    </div>
                </div>

                <UserSubscriptionCard
                    userId={user.id}
                    currentPlanId={entitlements.planId}
                    currentPlanLabel={entitlements.label}
                    currentStatus={latestSubscription?.status ?? "free"}
                    currentPeriodEnd={latestSubscription?.currentPeriodEnd ?? null}
                    gracePeriodEndsAt={latestSubscription?.gracePeriodEndsAt ?? null}
                    latestNotes={latestSubscription?.notes ?? null}
                />
            </div>
        </>
    );
}
