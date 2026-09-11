import { FormEvent } from "react";
import {
    ClipboardDocumentIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import type { Guest } from "@/types/guests";
import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";

type GuestInfoDialogProps = {
    guest: Guest | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (event: FormEvent<HTMLFormElement>) => void;
    onDelete: (guest: Guest) => void;
    onCopyEmail: (email: string) => void;
    editStatus: Guest["rsvpStatus"] | "pending";
    onEditStatusChange: (value: Guest["rsvpStatus"] | "pending") => void;
    editInvitationSent: boolean;
    onEditInvitationSentChange: (value: boolean) => void;
    editInvitationOpened: boolean;
    onEditInvitationOpenedChange: (value: boolean) => void;
};

export function GuestInfoDialog({
    guest,
    isOpen,
    onOpenChange,
    onSave,
    onDelete,
    onCopyEmail,
    editStatus,
    editInvitationSent,
    onEditInvitationSentChange,
    editInvitationOpened,
    onEditInvitationOpenedChange,
}: GuestInfoDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="flex flex-wrap items-center gap-3">
                        <DialogTitle>{guest?.name ?? "Guest details"}</DialogTitle>
                        {guest && (
                            <GuestStatusBadge
                                status={editStatus === "pending" ? null : (editStatus ?? null)}
                            />
                        )}
                    </div>
                    <DialogDescription className="hidden sm:block">
                        Review RSVP information, event context, and
                        communication history.
                    </DialogDescription>
                </DialogHeader>

                {guest && (
                    <form onSubmit={onSave}>
                    <DialogBody className="space-y-4">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Invitation Sent</TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant={editInvitationSent ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => onEditInvitationSentChange(!editInvitationSent)}
                                        >
                                            {editInvitationSent ? "Sent" : "Not sent"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Invitation Opened</TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant={editInvitationOpened ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => onEditInvitationOpenedChange(!editInvitationOpened)}
                                        >
                                            {editInvitationOpened ? "Opened" : "Not opened"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium align-top pt-3">Note from guest</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {guest.rsvpNote || (
                                            <span className="italic text-muted-foreground/60">No note provided</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </DialogBody>
                    <DialogFooter className="sm:justify-between">
                        <Button
                            type="button"
                            variant="link"
                            className="gap-2 text-foreground hover:text-primary"
                            onClick={() => onCopyEmail(guest.email ?? "")}
                        >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            Copy guest email
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => onDelete(guest)}
                            >
                                <TrashIcon className="h-4 w-4" />
                                Remove
                            </Button>
                            <Button type="submit" className="gap-2">
                                Save changes
                            </Button>
                        </div>
                    </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
