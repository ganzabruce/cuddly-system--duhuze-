"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    EyeIcon,
    EyeSlashIcon,
    TrashIcon,
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
import type { EventWithStats } from "@/types/admin";

type EventActionsProps = {
    event: EventWithStats;
    onToggleVisibility: () => Promise<void>;
    onDelete: () => Promise<void>;
    isToggling?: boolean;
    isDeleting?: boolean;
};

export function EventActions({
    event,
    onToggleVisibility,
    onDelete,
    isToggling = false,
    isDeleting = false,
}: EventActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const isPublic = event.visibility === "public";

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onToggleVisibility}
                disabled={isToggling}
                className="gap-2"
            >
                {isPublic ? (
                    <>
                        <EyeSlashIcon className="h-4 w-4" />
                        Make Private
                    </>
                ) : (
                    <>
                        <EyeIcon className="h-4 w-4" />
                        Make Public
                    </>
                )}
            </Button>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger
                    render={
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={isDeleting}
                        />
                    }
                >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{event.title}&quot;? This action
                            cannot be undone. All guests and RSVPs associated with this event
                            will also be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
