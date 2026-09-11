"use client";

import type { AuditLogEntry } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

type AuditLogTableProps = {
    entries: AuditLogEntry[];
};

export function AuditLogTable({ entries }: AuditLogTableProps) {
    return (
        <>
            <div className="space-y-3 md:hidden">
                {entries.length === 0 ? (
                    <div className="rounded-md border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                        No audit entries match your filters.
                    </div>
                ) : (
                    entries.map((entry) => (
                        <article
                            key={entry.id}
                            className="rounded-md border border-border bg-card p-4"
                        >
                            <div className="flex items-start gap-3">
                                <ClipboardDocumentListIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                        {entry.action}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(entry.createdAt), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Target
                                    </dt>
                                    <dd className="mt-1 text-foreground">
                                        {entry.targetType
                                            ? `${entry.targetType}${entry.targetId ? ` #${entry.targetId}` : ""}`
                                            : "—"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Admin
                                    </dt>
                                    <dd className="mt-1 break-words text-foreground">
                                        {entry.adminEmail}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Details
                                    </dt>
                                    <dd className="mt-1">
                                        {entry.details ? (
                                            <code className="block overflow-x-auto rounded bg-muted px-2 py-2 text-xs text-muted-foreground">
                                                {JSON.stringify(entry.details)}
                                            </code>
                                        ) : (
                                            <span className="text-foreground">—</span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </article>
                    ))
                )}
            </div>

            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center">
                                    No audit entries match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{entry.action}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {entry.targetType ? `${entry.targetType}${entry.targetId ? ` #${entry.targetId}` : ""}` : "—"}
                                    </TableCell>
                                    <TableCell>{entry.adminEmail}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {entry.details ? (
                                            <code className="rounded bg-muted px-2 py-1 text-xs">
                                                {JSON.stringify(entry.details)}
                                            </code>
                                        ) : (
                                            "—"
                                        )}
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
