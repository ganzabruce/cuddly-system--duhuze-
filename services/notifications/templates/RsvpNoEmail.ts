import type { RsvpConfirmationContent, RsvpUpdateContent } from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderFallbackLink,
    renderParagraph,
} from "./email-blocks";
import { renderRsvpSections } from "./rsvp-email-content";

export function rsvpConfirmationNoHtml(params: RsvpConfirmationContent): string {
    const { guestName, eventTitle, eventPageLink } = params;

    const manageBlock = eventPageLink
        ? `${renderActionButton("Manage your RSVP", eventPageLink)}${renderFallbackLink(
            eventPageLink,
            "If the button does not work, copy and paste this RSVP link into your browser:",
        )}`
        : "";

    return renderLayout({
        preheader: `RSVP confirmed for ${eventTitle}`,
        heading: "We'll miss you",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`Thank you very much for letting us know. We are truly sorry that you won't be able to join us for this special event <strong>${escapeHtml(eventTitle)}</strong>, and your presence will certainly be missed. We sincerely appreciate your feedback, and we look forward to seeing you at one of our future gatherings.`)}
${renderParagraph(`Thank You.`)}
${renderRsvpSections(params)}
${manageBlock}`,
        footerNote: "You can always update your RSVP from your event page.",
    });
}

export function rsvpUpdateNoHtml(params: RsvpUpdateContent): string {
    const { guestName, eventTitle, eventPageLink } = params;

    return renderLayout({
        preheader: `Updated response for ${eventTitle}`,
        heading: "We'll miss you",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`We've received your updated response. We're sorry you won't be able to make it to <strong>${escapeHtml(eventTitle)}</strong> anymore, and your presence will certainly be missed. We hope to see you at a future event.`)}
${renderRsvpSections(params)}
${renderActionButton("Manage your RSVP", eventPageLink)}
${renderFallbackLink(
    eventPageLink,
    "If the button does not work, copy and paste this RSVP link into your browser:",
)}`,
        footerNote: "This link lets you update your RSVP any time before the event.",
    });
}
