import type { EventInviteContent } from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderFallbackLink,
    renderMutedParagraph,
    renderParagraph,
} from "./email-blocks";

export function inviteEmailHtml(params: EventInviteContent): string {
    const { guestName, eventTitle, rsvpLink, eventDate, organizerName } = params;

    const invitedByLine = organizerName
        ? `You're invited by <strong>${escapeHtml(organizerName)}</strong> to attend <strong>${escapeHtml(eventTitle)}</strong>${eventDate ? ` on ${escapeHtml(eventDate)}` : ""}.`
        : `You're invited to <strong>${escapeHtml(eventTitle)}</strong>${eventDate ? ` on ${escapeHtml(eventDate)}` : ""}.`;

    return renderLayout({
        preheader: `You're invited to ${eventTitle}`,
        heading: "You're invited",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(invitedByLine)}
${renderActionButton("Respond now", rsvpLink)}
${renderFallbackLink(rsvpLink)}
${renderMutedParagraph("You can use this same link later to update your response.")}`,
    });
}
