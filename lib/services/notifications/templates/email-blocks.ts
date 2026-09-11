import type { RsvpStatusLabel } from "@/lib/email/types";
import {
    buttonRowStyle,
    compactParagraphStyle,
    ctaStyle,
    centeredMutedStyle,
    escapeHtml,
    infoCardStyle,
    linkStyle,
    listStyle,
    mutedParagraphStyle,
    paragraphStyle,
    qrImageStyle,
    qrWrapStyle,
    quoteStyle,
    renderSectionLabel,
    RSVP_STATUS_LABELS,
    statusBadgeRowStyle,
    tw,
} from "./email-styles";

const STATUS_BADGE_STYLES: Record<
    RsvpStatusLabel,
    { bg: string; color: string; icon: string }
> = {
    yes: { bg: "#dcfce7", color: "#15803d", icon: "&#10003;" },
    no: { bg: "#fee2e2", color: "#b91c1c", icon: "&#10007;" },
    maybe: { bg: "#fef9c3", color: "#92400e", icon: "~" },
};

export function renderParagraph(content: string, style = paragraphStyle): string {
    return `<p style="${style}">${content}</p>`;
}

export function renderMutedParagraph(content: string): string {
    return renderParagraph(content, mutedParagraphStyle);
}

export function renderActionButton(label: string, href: string): string {
    return `<p style="${buttonRowStyle}"><a href="${escapeHtml(href)}" style="${ctaStyle}">${escapeHtml(label)}</a></p>`;
}

export function renderFallbackLink(
    href: string,
    intro = "If the button does not work, copy and paste this link into your browser:",
): string {
    const safeHref = escapeHtml(href);
    return renderMutedParagraph(
        `${escapeHtml(intro)}<br><a href="${safeHref}" style="${linkStyle}">${safeHref}</a>`,
    );
}

export function renderSection(
    title: string,
    content: string,
    options?: { card?: boolean },
): string {
    const body = options?.card ? `<div style="${infoCardStyle}">${content}</div>` : content;
    return `${renderSectionLabel(title)}${body}`;
}

export function renderList(items: string[]): string {
    return `<ul style="${listStyle}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

export function renderQuotedText(text: string): string {
    return renderParagraph(`&ldquo;${escapeHtml(text)}&rdquo;`, quoteStyle);
}

export function renderQrBlock(params: {
    imageUrl: string;
    caption: string;
    alt?: string;
}): string {
    return `<div style="${qrWrapStyle}"><img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(params.alt ?? "Guest QR code")}" width="180" height="180" style="${qrImageStyle}" /><p style="${centeredMutedStyle}">${escapeHtml(params.caption)}</p></div>`;
}

export function renderStatusBadge(status: RsvpStatusLabel): string {
    const badge = STATUS_BADGE_STYLES[status];
    return `<p style="${statusBadgeRowStyle}"><span style="display: inline-block; background-color: ${badge.bg}; color: ${badge.color}; padding: 5px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;">${badge.icon}&nbsp; ${escapeHtml(RSVP_STATUS_LABELS[status])}</span></p>`;
}

export function renderAdditionalGuestsNote(count: number): string {
    return renderMutedParagraph(
        `+${count} additional guest${count > 1 ? "s" : ""}`,
    );
}

export function renderKeyValueRow(label: string, value: string): string {
    return renderParagraph(
        `<strong>${escapeHtml(label)}:</strong> ${value}`,
        compactParagraphStyle,
    );
}

export function renderContributionTotalRow(value: string): string {
    return `<tr style="border-top: 1px solid ${tw.border};"><td style="padding: 6px 16px 3px 0; font-weight: 700;">Total</td><td style="padding: 6px 0 3px 0; text-align: right; font-weight: 700;">${value}</td></tr>`;
}
