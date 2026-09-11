import type { RsvpConfirmationContent, RsvpUpdateContent } from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderFallbackLink,
    renderParagraph,
} from "./email-blocks";
import { renderRsvpSections } from "./rsvp-email-content";

export function rsvpConfirmationMaybeHtml(params: RsvpConfirmationContent): string {
    const { guestName, eventTitle, eventPageLink } = params;

    const manageBlock = eventPageLink
        ? `${renderActionButton("Manage your RSVP", eventPageLink)}${renderFallbackLink(
            eventPageLink,
            "If the button does not work, copy and paste this RSVP link into your browser:",
        )}`
        : "";

    return renderLayout({
        preheader: `RSVP confirmed for ${eventTitle}`,
        heading: "We'll keep a spot for you",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`Thank you for letting us know! We've noted your interest in <strong>${escapeHtml(eventTitle)}</strong> and we'll keep a spot for you. Feel free to update your response anytime.`)}
${renderRsvpSections(params)}
${manageBlock}`,
        footerNote: "You can always update your RSVP from your event page.",
    });
}

export function rsvpUpdateMaybeHtml(params: RsvpUpdateContent): string {
    const { guestName, eventTitle, eventPageLink } = params;

    return renderLayout({
        preheader: `Updated response for ${eventTitle}`,
        heading: "Your RSVP has been updated",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`We've noted your updated response for <strong>${escapeHtml(eventTitle)}</strong>. We'll keep a spot for you — feel free to update again anytime.`)}
${renderRsvpSections(params)}
${renderActionButton("Manage your RSVP", eventPageLink)}
${renderFallbackLink(
    eventPageLink,
    "If the button does not work, copy and paste this RSVP link into your browser:",
)}`,
        footerNote: "This link lets you update your RSVP any time before the event.",
    });
}
