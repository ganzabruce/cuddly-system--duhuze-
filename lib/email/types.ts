/** Base fields shared by event-related emails */
export interface EventEmailBase {
    guestName: string;
    eventTitle: string;
    eventDate?: string;
    organizerName?: string;
}

/** Content for invite and reminder emails (same shape, different copy) */
export interface EventInviteContent extends EventEmailBase {
    /** Per-guest link for invitation/RSVP */
    rsvpLink: string;
    /** Optional hosted guest QR code image URL for quick access/check-in */
    qrImageUrl?: string;
}

export type RsvpStatusLabel = "yes" | "no" | "maybe";

/** Content for RSVP confirmation email */
export interface RsvpConfirmationContent extends EventEmailBase {
    rsvpStatus: RsvpStatusLabel;
    rsvpNote?: string | null;
    eventPageLink?: string;
    qrImageUrl?: string;
    eventTime?: string;
    locationName?: string;
    locationLink?: string;
    locationType?: "online" | "in_person";
    additionalGuests?: Array<{
        name?: string | null;
        categoryLabel?: string | null;
        contributionAmount?: number;
    }>;
    customQuestionResponses?: Array<{ label: string; answer: string }>;
    contributionRequired?: boolean;
    contributionAmount?: number;
    contributionPaymentInfo?: string | null;
    currency?: string;
}

/** Content for RSVP update confirmation email */
export interface RsvpUpdateContent extends EventEmailBase {
    rsvpStatus: RsvpStatusLabel;
    eventPageLink: string;
    rsvpNote?: string | null;
    eventTime?: string;
    locationName?: string;
    locationLink?: string;
    locationType?: "online" | "in_person";
    additionalGuests?: Array<{
        name?: string | null;
        categoryLabel?: string | null;
        contributionAmount?: number;
    }>;
    customQuestionResponses?: Array<{ label: string; answer: string }>;
    contributionRequired?: boolean;
    contributionAmount?: number;
    contributionPaymentInfo?: string | null;
    currency?: string;
}

/** Organizer notification action types */
export type OrganizerNotificationAction =
    | "rsvp_new"
    | "rsvp_updated";

/** Content for organizer notification emails */
export interface OrganizerNotificationContent {
    organizerName: string;
    guestName: string;
    guestEmail: string;
    eventTitle: string;
    eventDate?: string;
    action: OrganizerNotificationAction;
    rsvpStatus?: RsvpStatusLabel;
    additionalGuestCount?: number;
    dashboardLink: string;
}
