"use client";

import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ErrorLogEntry } from "@/types/admin";

type ErrorDetailDialogProps = {
    entry: ErrorLogEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolve?: (entry: ErrorLogEntry) => void;
    resolvePending?: boolean;
};

export function ErrorDetailDialog({
    entry,
    open,
    onOpenChange,
    onResolve,
    resolvePending,
}: ErrorDetailDialogProps) {
    if (!entry) return null;

    const formatDate = (date: Date) =>
        new Date(date).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "medium",
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span
                            className={
                                entry.level === "error"
                                    ? "text-destructive"
                                    : "text-warning"
                            }
                        >
                            {entry.level.toUpperCase()}
                        </span>
                        {entry.source && (
                            <span className="text-sm font-normal text-muted-foreground">
                                {entry.source}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-4 text-sm">
                    <div>
                        <p className="site-eyebrow mb-1">Time</p>
                        <div className="text-foreground">{formatDate(entry.createdAt)}</div>
                    </div>
                    <div>
                        <p className="site-eyebrow mb-1">Message</p>
                        <pre className="whitespace-pre-wrap break-words rounded bg-muted/50 p-3 text-foreground font-sans">
                            {entry.message}
                        </pre>
                    </div>
                    {entry.stack && (
                        <div>
                            <p className="site-eyebrow mb-1">Stack trace</p>
                            <pre className="whitespace-pre-wrap break-words rounded bg-muted/50 p-3 text-muted-foreground text-xs font-mono">
                                {entry.stack}
                            </pre>
                        </div>
                    )}
                    {entry.context && Object.keys(entry.context).length > 0 && (
                        <div>
                            <p className="site-eyebrow mb-1">Context</p>
                            <pre className="whitespace-pre-wrap break-words rounded bg-muted/50 p-3 text-muted-foreground text-xs font-mono">
                                {JSON.stringify(entry.context, null, 2)}
                            </pre>
                        </div>
                    )}
                    {entry.resolved && entry.resolvedAt && (
                        <div>
                            <p className="site-eyebrow mb-1">Resolved</p>
                            <div className="text-foreground">
                                {formatDate(entry.resolvedAt)}
                                {entry.resolvedBy && (
                                    <span className="text-muted-foreground">
                                        {" "}
                                        by {entry.resolvedBy}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </DialogBody>
                {!entry.resolved && onResolve && (
                    <DialogFooter>
                        <Button
                            size="sm"
                            onClick={() => onResolve(entry)}
                            disabled={resolvePending}
                        >
                            {resolvePending ? "Resolving…" : "Mark as resolved"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
