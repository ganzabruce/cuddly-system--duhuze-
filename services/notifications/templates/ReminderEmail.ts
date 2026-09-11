import type { EventInviteContent } from "@/lib/email/types";
import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import {
    renderActionButton,
    renderFallbackLink,
    renderParagraph,
    renderQrBlock,
} from "./email-blocks";

export function reminderEmailHtml(params: EventInviteContent): string {
    const { guestName, eventTitle, rsvpLink, eventDate, qrImageUrl, organizerName } = params;
    const qrBlock = qrImageUrl
        ? renderQrBlock({
            imageUrl: qrImageUrl,
            caption: "You can also scan this QR code to respond to your invite quickly.",
        })
        : "";

    const invitedByLine = organizerName
        ? `This is a friendly reminder that you're invited by <strong>${escapeHtml(organizerName)}</strong> to attend <strong>${escapeHtml(eventTitle)}</strong>${eventDate ? ` on ${escapeHtml(eventDate)}` : ""}.`
        : `This is a friendly reminder that you're invited to <strong>${escapeHtml(eventTitle)}</strong>${eventDate ? ` on ${escapeHtml(eventDate)}` : ""}.`;

    return renderLayout({
        preheader: `Reminder to RSVP for ${eventTitle}`,
        heading: "We'd love to see you there",
        bodyHtml: `${renderParagraph(`Hi ${escapeHtml(guestName)},`, firstParagraphStyle)}
${renderParagraph(invitedByLine)}
${renderParagraph("We'd love to know if you can make it - please respond below.")}
${renderActionButton("RSVP now", rsvpLink)}
${renderFallbackLink(rsvpLink)}
${qrBlock}`,
    });
}
