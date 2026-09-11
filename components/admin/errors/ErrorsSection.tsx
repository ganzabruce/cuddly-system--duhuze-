"use client";

import { use } from "react";
import type { getErrorsPageDataAction } from "@/actions/admin/errors";
import { ErrorsClient } from "./ErrorsClient";
import { AppHealthStatusBanner } from "@/components/admin/health/AppHealthStatusBanner";

type ErrorsSectionProps = {
    dataPromise: ReturnType<typeof getErrorsPageDataAction>;
    level: "all" | "warn" | "error";
    resolved: boolean | undefined;
    source: string;
};

export function ErrorsSection({ dataPromise, level, resolved, source }: ErrorsSectionProps) {
    const { logResult, healthResult, overallHealth } = use(dataPromise);

    return (
        <>
            <div className="mb-4">
                <AppHealthStatusBanner result={healthResult} overall={overallHealth} compact />
            </div>
            <ErrorsClient
                initialEntries={logResult.entries}
                initialTotal={logResult.total}
                initialPage={logResult.page}
                initialLevel={level}
                initialResolved={resolved === undefined ? "all" : resolved ? "resolved" : "unresolved"}
                initialSource={source}
            />
        </>
    );
}
