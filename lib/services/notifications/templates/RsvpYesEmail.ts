import type { RsvpConfirmationContent, RsvpUpdateContent } from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderFallbackLink,
    renderParagraph,
    renderQrBlock,
} from "./email-blocks";
import { renderRsvpSections } from "./rsvp-email-content";

export function rsvpConfirmationYesHtml(params: RsvpConfirmationContent): string {
    const { guestName, eventTitle, eventPageLink, qrImageUrl } = params;

    const manageBlock = eventPageLink
        ? `${renderActionButton("Manage your RSVP", eventPageLink)}${renderFallbackLink(
            eventPageLink,
            "If the button does not work, copy and paste this RSVP link into your browser:",
        )}`
        : "";

    const qrBlock = qrImageUrl
        ? renderQrBlock({
            imageUrl: qrImageUrl,
            caption: "Scan this QR code at the door.",
        })
        : "";

    return renderLayout({
        preheader: `RSVP confirmed for ${eventTitle}`,
        heading: "See you there!",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`You're all set! Here's a look at your RSVP for <strong>${escapeHtml(eventTitle)}</strong>.`)}
${renderRsvpSections(params)}
${manageBlock}
${qrBlock}`,
        footerNote: "You can always update your RSVP from your event page.",
    });
}

export function rsvpUpdateYesHtml(params: RsvpUpdateContent): string {
    const { guestName, eventTitle, eventPageLink } = params;

    return renderLayout({
        preheader: `Updated response for ${eventTitle}`,
        heading: "Your RSVP has been updated",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(`All noted — here's your updated RSVP for <strong>${escapeHtml(eventTitle)}</strong>.`)}
${renderRsvpSections(params)}
${renderActionButton("Manage your RSVP", eventPageLink)}
${renderFallbackLink(
    eventPageLink,
    "If the button does not work, copy and paste this RSVP link into your browser:",
)}`,
        footerNote: "This link lets you update your RSVP any time before the event.",
    });
}
