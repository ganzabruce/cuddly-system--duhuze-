"use client";

import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import type { ErrorLogEntry } from "@/types/admin";

type ErrorLogTableProps = {
    entries: ErrorLogEntry[];
    onViewDetail: (entry: ErrorLogEntry) => void;
    onResolve?: (entry: ErrorLogEntry) => void;
    resolvePendingId?: number | null;
};

export function ErrorLogTable({
    entries,
    onViewDetail,
    onResolve,
    resolvePendingId,
}: ErrorLogTableProps) {
    const formatDate = (date: Date) =>
        new Date(date).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "medium",
        });

    return (
        <>
            <div className="space-y-3 md:hidden">
                {entries.length === 0 ? (
                    <div className="rounded-md border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                        No errors match the current filters
                    </div>
                ) : (
                    entries.map((entry) => (
                        <article
                            key={entry.id}
                            className="rounded-md border border-border bg-card p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(entry.createdAt)}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {entry.message}
                                    </p>
                                </div>
                                <Badge
                                    variant={entry.level === "error" ? "destructive" : "warning"}
                                    className="gap-1"
                                >
                                    {entry.level === "error" ? (
                                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                    ) : (
                                        <InformationCircleIcon className="h-3.5 w-3.5" />
                                    )}
                                    {entry.level}
                                </Badge>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Source
                                    </dt>
                                    <dd className="mt-1 break-words text-foreground">
                                        {entry.source ?? "—"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd className="mt-1">
                                        {entry.resolved ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <CheckCircleIcon className="h-4 w-4 text-success" />
                                                Resolved
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-warning-deep">
                                                Unresolved
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => onViewDetail(entry)}
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    View details
                                </button>
                                {!entry.resolved && onResolve && (
                                    <button
                                        type="button"
                                        onClick={() => onResolve(entry)}
                                        disabled={resolvePendingId === entry.id}
                                        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
                                    >
                                        {resolvePendingId === entry.id ? "Resolving..." : "Resolve"}
                                    </button>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead className="w-20">Level</TableHead>
                            <TableHead className="min-w-[200px]">Message</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center">
                                    No errors match the current filters
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {formatDate(entry.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                    <Badge
                                        variant={entry.level === "error" ? "destructive" : "warning"}
                                        className="gap-1"
                                    >
                                        {entry.level === "error" ? (
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                        ) : (
                                            <InformationCircleIcon className="h-3.5 w-3.5" />
                                        )}
                                        {entry.level}
                                    </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <span className="line-clamp-2" title={entry.message}>
                                            {entry.message}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {entry.source ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        {entry.resolved ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <CheckCircleIcon className="h-4 w-4 text-success" />
                                                Resolved
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-warning-deep">
                                                Unresolved
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail(entry)}
                                                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                                aria-label="View details"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            {!entry.resolved && onResolve && (
                                                <button
                                                    type="button"
                                                    onClick={() => onResolve(entry)}
                                                    disabled={resolvePendingId === entry.id}
                                                    className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition"
                                                >
                                                    {resolvePendingId === entry.id ? "…" : "Resolve"}
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
