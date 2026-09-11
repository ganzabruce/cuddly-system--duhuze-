"use client";

import { use } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { getDashboardCheckoutData } from "@/actions/billing/dashboard";
import { DashboardPaymentForm } from "@/components/billing/checkout/DashboardPaymentForm";
import { DashboardPlanView } from "@/components/billing/checkout/DashboardPlanView";
import { PendingPlanActions } from "@/components/billing/checkout/PendingPlanActions";

export function DashboardCheckoutPage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardCheckoutData>;
}) {
    const data = use(dataPromise);

    if (data.view === "blocked") {
        return (
            <div className="w-full min-w-0">
                <PendingPlanNotice title={data.title} description={data.description} />
            </div>
        );
    }

    if (data.view === "plan-selector") {
        return (
            <div className="w-full min-w-0">
                <DashboardPlanView
                    currentPlanId={data.currentPlanId}
                    activePromotion={data.activePromotion}
                />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <DashboardPaymentForm
                planId={data.planId}
                initialPeriod={data.billingPeriod}
                userName={data.userName}
                userEmail={data.userEmail}
                isCardPaymentEnabled={data.isCardPaymentEnabled}
            />
        </div>
    );
}

function PendingPlanNotice({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-2xl items-center justify-center px-4 py-8">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-primary"
                        >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <CardTitle className="mt-4 text-xl">{title}</CardTitle>
                    <CardDescription className="mt-2">
                        You can’t start a new billing change right now.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <PendingPlanActions />
                </CardFooter>
            </Card>
        </div>
    );
}
