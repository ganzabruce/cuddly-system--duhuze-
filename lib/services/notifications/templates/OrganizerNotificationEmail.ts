import type {
    OrganizerNotificationContent,
    OrganizerNotificationAction,
    RsvpStatusLabel,
} from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderAdditionalGuestsNote,
    renderFallbackLink,
    renderParagraph,
    renderSection,
} from "./email-blocks";

const RSVP_STATUS_LABELS: Record<RsvpStatusLabel, string> = {
    yes: "attending",
    no: "not attending",
    maybe: "maybe",
};

const ACTION_HEADINGS: Record<OrganizerNotificationAction, string> = {
    rsvp_new: "New RSVP received",
    rsvp_updated: "RSVP updated",
};

function sanitizeSubjectValue(value: string): string {
    return value.replace(/[\r\n]+/g, " ").trim();
}

function buildSubjectLine(action: OrganizerNotificationAction, guestName: string, eventTitle: string): string {
    const safeGuestName = sanitizeSubjectValue(guestName);
    const safeEventTitle = sanitizeSubjectValue(eventTitle);
    switch (action) {
        case "rsvp_new":
            return `${safeGuestName} responded to ${safeEventTitle}`;
        case "rsvp_updated":
            return `${safeGuestName} updated their response to ${safeEventTitle}`;
    }
}

function buildSubjectLineWithStatus(
    action: OrganizerNotificationAction,
    guestName: string,
    eventTitle: string,
    rsvpStatus?: RsvpStatusLabel,
): string {
    const safeGuestName = sanitizeSubjectValue(guestName);
    const safeEventTitle = sanitizeSubjectValue(eventTitle);
    if (rsvpStatus) {
        return `${safeGuestName} responded ${RSVP_STATUS_LABELS[rsvpStatus]} to ${safeEventTitle}`;
    }
    return buildSubjectLine(action, safeGuestName, safeEventTitle);
}

function buildBody(params: OrganizerNotificationContent): string {
    const {
        organizerName,
        guestName,
        guestEmail,
        eventTitle,
        eventDate,
        action,
        rsvpStatus,
        additionalGuestCount,
        dashboardLink,
    } = params;

    const greeting = renderParagraph(
        `Hi ${escapeHtml(organizerName)},`,
        firstParagraphStyle,
    );

    let detail: string;
    switch (action) {
        case "rsvp_new":
            detail = renderSection(
                "Guest activity",
                renderParagraph(
                    `<strong>${escapeHtml(guestName)}</strong> (${escapeHtml(guestEmail)}) just responded <strong>${rsvpStatus ? escapeHtml(RSVP_STATUS_LABELS[rsvpStatus]) : "-"}</strong> to <strong>${escapeHtml(eventTitle)}</strong>${eventDate ? ` on ${escapeHtml(eventDate)}` : ""}.`,
                    "margin: 4px 0;",
                ),
                { card: true },
            );
            break;
        case "rsvp_updated":
            detail = renderSection(
                "Guest activity",
                renderParagraph(
                    `<strong>${escapeHtml(guestName)}</strong> (${escapeHtml(guestEmail)}) updated their response to <strong>${rsvpStatus ? escapeHtml(RSVP_STATUS_LABELS[rsvpStatus]) : "-"}</strong> for <strong>${escapeHtml(eventTitle)}</strong>.`,
                    "margin: 4px 0;",
                ),
                { card: true },
            );
            break;
    }

    const additionalGuestsNote =
        additionalGuestCount && additionalGuestCount > 0
            ? renderAdditionalGuestsNote(additionalGuestCount)
            : "";

    const link = `${renderActionButton("View guest list", dashboardLink)}${renderFallbackLink(dashboardLink)}`;

    return `${greeting}${detail}${additionalGuestsNote}${link}`;
}

export function organizerNotificationEmailHtml(params: OrganizerNotificationContent): string {
    return renderLayout({
        preheader: buildSubjectLineWithStatus(
            params.action,
            params.guestName,
            params.eventTitle,
            params.rsvpStatus,
        ),
        heading: ACTION_HEADINGS[params.action],
        bodyHtml: buildBody(params),
        footerNote: "You're receiving this because you organized this event.",
    });
}

export function organizerNotificationSubject(params: OrganizerNotificationContent): string {
    return buildSubjectLineWithStatus(
        params.action,
        params.guestName,
        params.eventTitle,
        params.rsvpStatus,
    );
}
