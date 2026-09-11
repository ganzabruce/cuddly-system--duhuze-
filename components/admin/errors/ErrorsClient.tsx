"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorLogFilters } from "./ErrorLogFilters";
import { ErrorLogTable } from "./ErrorLogTable";
import { ErrorDetailDialog } from "./ErrorDetailDialog";
import { TablePagination } from "@/components/ui/table-pagination";
import type { ErrorLogEntry } from "@/types/admin";
import { resolveErrorAction } from "@/actions/admin/errors";

type ErrorsClientProps = {
    initialEntries: ErrorLogEntry[];
    initialTotal: number;
    initialPage: number;
    initialLevel: "all" | "warn" | "error";
    initialResolved: "all" | "resolved" | "unresolved";
    initialSource: string;
};

export function ErrorsClient({
    initialEntries,
    initialTotal,
    initialPage,
    initialLevel,
    initialResolved,
    initialSource,
}: ErrorsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();
    const [detailEntry, setDetailEntry] = useState<ErrorLogEntry | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [resolvePendingId, setResolvePendingId] = useState<number | null>(null);

    const [levelFilter, setLevelFilter] = useState<"all" | "warn" | "error">(initialLevel);
    const [resolvedFilter, setResolvedFilter] = useState<
        "all" | "resolved" | "unresolved"
    >(initialResolved);
    const [sourceSearch, setSourceSearch] = useState(initialSource);

    const updateURL = (updates: {
        level?: "all" | "warn" | "error";
        resolved?: "all" | "resolved" | "unresolved";
        source?: string;
        page?: number;
    }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (updates.level !== undefined && updates.level !== "all") {
            params.set("level", updates.level);
        } else {
            params.delete("level");
        }
        if (updates.resolved !== undefined && updates.resolved !== "all") {
            params.set("resolved", updates.resolved);
        } else {
            params.delete("resolved");
        }
        if (updates.source !== undefined) {
            if (updates.source) params.set("source", updates.source);
            else params.delete("source");
        }
        if (updates.page !== undefined && updates.page > 1) {
            params.set("page", updates.page.toString());
        } else {
            params.delete("page");
        }
        startTransition(() => {
            router.push(`/admin/errors?${params.toString()}`);
        });
    };

    const handleLevelChange = (value: "all" | "warn" | "error") => {
        setLevelFilter(value);
        updateURL({ level: value, page: 1 });
    };
    const handleResolvedChange = (value: "all" | "resolved" | "unresolved") => {
        setResolvedFilter(value);
        updateURL({ resolved: value, page: 1 });
    };
    const handleSourceChange = (value: string) => {
        setSourceSearch(value);
        updateURL({ source: value, page: 1 });
    };
    const handlePageChange = (page: number) => {
        updateURL({ page });
    };

    const handleViewDetail = (entry: ErrorLogEntry) => {
        setDetailEntry(entry);
        setDetailOpen(true);
    };

    const handleResolve = async (entry: ErrorLogEntry) => {
        setResolvePendingId(entry.id);
        const result = await resolveErrorAction(entry.id);
        setResolvePendingId(null);
        if (result.success) {
            if (detailEntry?.id === entry.id) {
                setDetailEntry({ ...entry, resolved: true, resolvedAt: new Date(), resolvedBy: null });
            }
            router.refresh();
        }
        if (detailOpen && detailEntry?.id === entry.id) {
            setDetailOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            <ErrorLogFilters
                levelFilter={levelFilter}
                onLevelFilterChange={handleLevelChange}
                resolvedFilter={resolvedFilter}
                onResolvedFilterChange={handleResolvedChange}
                sourceSearch={sourceSearch}
                onSourceSearchChange={handleSourceChange}
            />
            <ErrorLogTable
                entries={initialEntries}
                onViewDetail={handleViewDetail}
                onResolve={handleResolve}
                resolvePendingId={resolvePendingId}
            />
            <TablePagination
                totalCount={initialTotal}
                pageSize={50}
                page={initialPage}
                onPageChange={handlePageChange}
                itemLabel="errors"
            />
            <ErrorDetailDialog
                entry={detailEntry}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onResolve={handleResolve}
                resolvePending={resolvePendingId !== null}
            />
        </div>
    );
}
