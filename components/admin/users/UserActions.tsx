"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserWithStats } from "@/types/admin";

type UserActionsProps = {
    user: UserWithStats;
    onSuspend: (reason: string) => Promise<void>;
    onUnsuspend: () => Promise<void>;
    isSuspending?: boolean;
    isUnsuspending?: boolean;
};

export function UserActions({
    user,
    onSuspend,
    onUnsuspend,
    isSuspending = false,
    isUnsuspending = false,
}: UserActionsProps) {
    const [suspendReason, setSuspendReason] = useState("");
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);

    const handleSuspend = async () => {
        if (!suspendReason.trim()) {
            return;
        }
        await onSuspend(suspendReason.trim());
        setSuspendReason("");
        setSuspendDialogOpen(false);
    };

    const isSuspended = user.status === "suspended";

    return (
        <div className="flex flex-wrap gap-2">
            {isSuspended ? (
                <AlertDialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={isUnsuspending}
                            />
                        }
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Unsuspend
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to unsuspend {user.name}? They will be
                                able to access their account again.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onUnsuspend}
                                disabled={isUnsuspending}
                            >
                                {isUnsuspending ? "Unsuspending..." : "Unsuspend"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : (
                <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={isSuspending}
                            />
                        }
                    >
                        <XCircleIcon className="h-4 w-4" />
                        Suspend
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Suspend User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Suspend {user.name}. They will not be able to access their
                                account until unsuspended.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="suspend-reason">Reason (required)</Label>
                                <Textarea
                                    id="suspend-reason"
                                    placeholder="Enter reason for suspension..."
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSuspend}
                                disabled={!suspendReason.trim() || isSuspending}
                            >
                                {isSuspending ? "Suspending..." : "Suspend"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

        </div>
    );
}
