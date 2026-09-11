"use client";

import { useState, useTransition } from "react";
import {
    ArrowDownTrayIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exportDataAction, deleteAccountAction } from "@/actions/auth/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { rowClass } from "@/components/auth/settingsStyles";

export const ACCOUNT_TAB_CONFIG = {
    value: "account",
    label: "Account",
    Icon: ExclamationTriangleIcon,
} as const;

type SettingsAccountTabProps = {
    username: string | null;
    userEmail: string;
};

export function SettingsAccountTab({ username, userEmail }: SettingsAccountTabProps) {
    const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
    const [isExporting, startExportTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [understood, setUnderstood] = useState(false);
    const [isDeleting, startDeleteTransition] = useTransition();

    const expectedConfirmation = username || userEmail || "";

    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportDataAction(exportFormat);
            if (result.success) {
                const blob = new Blob([result.data], {
                    type: result.filename.endsWith(".json")
                        ? "application/json"
                        : "text/csv",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export downloaded");
            } else {
                toast.error(result.error);
            }
        });
    };

    const canDelete =
        understood &&
        confirmText.trim().toLowerCase() === expectedConfirmation.toLowerCase();

    const handleDelete = () => {
        if (!canDelete) return;
        startDeleteTransition(async () => {
            const result = await deleteAccountAction(confirmText.trim());
            if (result.success) setDeleteOpen(false);
            else toast.error(result.error);
        });
    };

    return (
        <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <h2 className="m-0 text-base font-semibold text-foreground">Account</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Export your data or delete your account
                </p>
            </div>
            <div className="divide-y divide-border px-4 py-2">
                {/* Export */}
                <div className={rowClass}>
                    <div>
                        <Label className="text-sm font-medium">Export your data</Label>
                        <p className="text-xs text-muted-foreground">
                            Download your profile, events, and guests
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-10 w-20 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-muted-foreground/50">
                                <span>{exportFormat === "json" ? "JSON" : "CSV"}</span>
                                <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className={cn(
                                        "justify-between gap-3",
                                        exportFormat === "json" && "bg-accent/50",
                                    )}
                                    onClick={() => setExportFormat("json")}
                                >
                                    <span>JSON</span>
                                    <span className="text-xs text-muted-foreground">
                                        Structured
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={cn(
                                        "justify-between gap-3",
                                        exportFormat === "csv" && "bg-accent/50",
                                    )}
                                    onClick={() => setExportFormat("csv")}
                                >
                                    <span>CSV</span>
                                    <span className="text-xs text-muted-foreground">
                                        Spreadsheet
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
                            {isExporting ? "Exporting…" : "Export"}
                        </Button>
                    </div>
                </div>

                {/* Delete */}
                <div className={rowClass}>
                    <div>
                        <Label className="text-sm font-medium text-destructive">
                            Delete account
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Permanently delete your account and all data. This cannot be undone.
                        </p>
                    </div>
                    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                            <TrashIcon className="mr-1.5 h-4 w-4" />
                            Delete account
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete account</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your account and all data. Type{" "}
                                    <strong className="text-foreground">
                                        {expectedConfirmation}
                                    </strong>{" "}
                                    to confirm.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="understood"
                                        checked={understood}
                                        onCheckedChange={(c) => setUnderstood(c === true)}
                                    />
                                    <Label
                                        htmlFor="understood"
                                        className="cursor-pointer text-sm font-normal leading-snug"
                                    >
                                        I understand that I will lose access to my account forever
                                        and this cannot be undone.
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-input">
                                        Type {username ? "your username" : "your email"} to
                                        confirm
                                    </Label>
                                    <Input
                                        id="confirm-input"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder={expectedConfirmation}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete();
                                    }}
                                    disabled={!canDelete || isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeleting ? "Deleting…" : "Delete account"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}
