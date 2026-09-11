"use client";

import {
    ClipboardDocumentIcon,
    EllipsisVerticalIcon,
    EnvelopeIcon,
    EyeIcon,
    LinkIcon,
    PaperAirplaneIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Guest } from "@/types/guests";

type GuestRowActionsProps = {
    guest: Guest;
    isReminding: boolean;
    onOpenDetail: () => void;
    onCopyEmail: () => void;
    onCopyRsvpLink: () => void;
    onRowReminder: () => void;
    onToggleInvitationSent: () => void;
    onDeleteGuest: () => void;
};

export function GuestRowActions({
    guest,
    isReminding,
    onOpenDetail,
    onCopyEmail,
    onCopyRsvpLink,
    onRowReminder,
    onToggleInvitationSent,
    onDeleteGuest,
}: GuestRowActionsProps) {
    const itemIconClassName = "size-4 shrink-0 text-muted-foreground";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Open guest actions"
                        className="h-8 w-8 hover:bg-card active:bg-card data-[state=open]:bg-card"
                    />
                }
            >
                <EllipsisVerticalIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2 p-2" onClick={onOpenDetail}>
                    <EyeIcon className={itemIconClassName} />
                    View details
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 p-2" onClick={onCopyEmail}>
                    <ClipboardDocumentIcon className={itemIconClassName} />
                    Copy email
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 p-2" onClick={onCopyRsvpLink}>
                    <LinkIcon className={itemIconClassName} />
                    Copy RSVP link
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="gap-2 p-2"
                    disabled={isReminding}
                    onClick={onRowReminder}
                >
                    <EnvelopeIcon className={itemIconClassName} />
                    {isReminding ? "Sending..." : "Send reminder"}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="gap-2 p-2"
                    onClick={onToggleInvitationSent}
                >
                    <PaperAirplaneIcon className={itemIconClassName} />
                    {guest.invitationSent ? "Mark as unsent" : "Mark as sent"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="gap-2 p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                    onClick={onDeleteGuest}
                >
                    <TrashIcon className="size-4 shrink-0" />
                    Remove guest
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
