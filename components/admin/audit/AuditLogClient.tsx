"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuditLogEntry } from "@/types/admin";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogTable } from "./AuditLogTable";
import { TablePagination } from "@/components/ui/table-pagination";

type AuditLogClientProps = {
    initialEntries: AuditLogEntry[];
    initialTotal: number;
    initialPage: number;
    pageSize: number;
    initialAction: string;
    initialTargetType: string;
    initialStartDate: string;
    initialEndDate: string;
};

export function AuditLogClient({
    initialEntries,
    initialTotal,
    initialPage,
    pageSize,
    initialAction,
    initialTargetType,
    initialStartDate,
    initialEndDate,
}: AuditLogClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [actionFilter, setActionFilter] = useState(initialAction);
    const [targetTypeFilter, setTargetTypeFilter] = useState(initialTargetType);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const updateURL = (updates: {
        action?: string;
        targetType?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
    }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (updates.action !== undefined) {
            if (updates.action) params.set("action", updates.action);
            else params.delete("action");
        }
        if (updates.targetType !== undefined) {
            if (updates.targetType) params.set("targetType", updates.targetType);
            else params.delete("targetType");
        }
        if (updates.startDate !== undefined) {
            if (updates.startDate) params.set("startDate", updates.startDate);
            else params.delete("startDate");
        }
        if (updates.endDate !== undefined) {
            if (updates.endDate) params.set("endDate", updates.endDate);
            else params.delete("endDate");
        }
        if (updates.page !== undefined && updates.page > 1) {
            params.set("page", updates.page.toString());
        } else {
            params.delete("page");
        }

        startTransition(() => {
            router.push(`/admin/audit-log?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-4">
            <AuditLogFilters
                action={actionFilter}
                onActionChange={(value: string) => {
                    setActionFilter(value);
                    updateURL({ action: value, page: 1 });
                }}
                targetType={targetTypeFilter}
                onTargetTypeChange={(value: string) => {
                    setTargetTypeFilter(value);
                    updateURL({ targetType: value, page: 1 });
                }}
                startDate={startDate}
                onStartDateChange={(value: string) => {
                    setStartDate(value);
                    updateURL({ startDate: value, page: 1 });
                }}
                endDate={endDate}
                onEndDateChange={(value: string) => {
                    setEndDate(value);
                    updateURL({ endDate: value, page: 1 });
                }}
                isPending={isPending}
            />

            <AuditLogTable entries={initialEntries} />

            <TablePagination
                totalCount={initialTotal}
                pageSize={pageSize}
                page={initialPage}
                onPageChange={(page) => updateURL({ page })}
                itemLabel="entries"
            />
        </div>
    );
}
