"use client";

import { Badge } from "@/components/ui/badge";
import {
    STATUS_BADGE_CLASSES,
    INVITED_BADGE_CLASSES,
    NOT_INVITED_BADGE_CLASSES,
    PENDING_BADGE_CLASSES,
    getStatusLabel,
} from "@/lib/constants/guests/guest-status";

type RsvpStatus = "yes" | "no" | "maybe" | null;

/** Single badge for RSVP status. When showInvitationState is true and status is null, shows "Invited"/"Not Invited" (dashboard). Otherwise shows "Pending" (event scope). */
type GuestStatusBadgeProps = {
    status: RsvpStatus;
    /** Set when status is null to show Invited/Not Invited instead of Pending (dashboard) */
    invitationSent?: boolean;
};

export function GuestStatusBadge({
    status,
    invitationSent,
}: GuestStatusBadgeProps) {
    if (!status) {
        if (invitationSent === true) {
            return (
                <Badge variant="secondary" className={INVITED_BADGE_CLASSES}>
                    Invited
                </Badge>
            );
        }
        if (invitationSent === false) {
            return (
                <Badge variant="secondary" className={NOT_INVITED_BADGE_CLASSES}>
                    Not Invited
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className={PENDING_BADGE_CLASSES}>
                Pending
            </Badge>
        );
    }

    return (
        <Badge className={STATUS_BADGE_CLASSES[status]}>
            {getStatusLabel(status)}
        </Badge>
    );
}
