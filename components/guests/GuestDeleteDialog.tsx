"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export type GuestDeleteDialogGuest = { name: string } | null;

type GuestDeleteDialogProps = {
    guest: GuestDeleteDialogGuest;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function GuestDeleteDialog({
    guest,
    isDeleting,
    onClose,
    onConfirm,
}: GuestDeleteDialogProps) {
    return (
        <Dialog open={Boolean(guest)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove {guest?.name ?? "guest"}</DialogTitle>
                    <DialogDescription>
                        This will permanently remove {guest?.name} from the
                        guest list and delete their RSVP data. This action cannot
                        be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete guest"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
