"use client";

import { use } from "react";
import type { getAuditLogAction } from "@/actions/admin/audit-log";
import { AuditLogClient } from "./AuditLogClient";

type AuditLogSectionProps = {
    resultPromise: ReturnType<typeof getAuditLogAction>;
    pageSize: number;
    initialAction: string;
    initialTargetType: string;
    initialStartDate: string;
    initialEndDate: string;
};

export function AuditLogSection({
    resultPromise,
    pageSize,
    initialAction,
    initialTargetType,
    initialStartDate,
    initialEndDate,
}: AuditLogSectionProps) {
    const result = use(resultPromise);

    return (
        <AuditLogClient
            initialEntries={result.entries}
            initialTotal={result.total}
            initialPage={result.page}
            pageSize={pageSize}
            initialAction={initialAction}
            initialTargetType={initialTargetType}
            initialStartDate={initialStartDate}
            initialEndDate={initialEndDate}
        />
    );
}
