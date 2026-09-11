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

interface DeleteEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteEventDialog({
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
}: DeleteEventDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Event</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this event? This action cannot be
                        undone and all guest data will be permanently removed.
                    </p>
                </DialogBody>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Event"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
