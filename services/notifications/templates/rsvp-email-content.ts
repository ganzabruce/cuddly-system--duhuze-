import type {
    RsvpConfirmationContent,
    RsvpUpdateContent,
} from "@/lib/email/types";
import { escapeHtml, linkStyle, tableStyle } from "./email-styles";
import {
    renderContributionTotalRow,
    renderKeyValueRow,
    renderList,
    renderParagraph,
    renderQuotedText,
    renderSection,
    renderStatusBadge,
} from "./email-blocks";

type SharedRsvpContent = RsvpConfirmationContent | RsvpUpdateContent;

function formatAmount(cents: number, currency: string): string {
    return `${cents.toLocaleString()} ${currency}`;
}

export function renderRsvpSections(params: SharedRsvpContent): string {
    const {
        guestName,
        eventDate,
        eventTime,
        rsvpStatus,
        rsvpNote,
        locationName,
        locationLink,
        locationType,
        additionalGuests,
        customQuestionResponses,
        contributionRequired,
        contributionAmount,
        contributionPaymentInfo,
        currency = "RWF",
    } = params;

    const responseSection = renderSection(
        "Your response",
        renderStatusBadge(rsvpStatus),
    );

    const detailRows: string[] = [];
    const dateTimeStr = [eventDate, eventTime].filter(Boolean).join(" at ");
    if (dateTimeStr) {
        detailRows.push(renderKeyValueRow("Date", escapeHtml(dateTimeStr)));
    }

    if (locationName) {
        const locationLabel = locationType === "online" ? "Online" : "Venue";
        const locationValue = locationLink
            ? `<a href="${escapeHtml(locationLink)}" style="${linkStyle}">${escapeHtml(locationName)}</a>`
            : escapeHtml(locationName);
        detailRows.push(renderKeyValueRow(locationLabel, locationValue));
    }

    const eventDetailsSection = detailRows.length > 0
        ? renderSection("Event details", detailRows.join(""), { card: true })
        : "";

    let groupSection = "";
    if (additionalGuests && additionalGuests.length > 0) {
        const guestRows = additionalGuests.map((guest, index) => {
            const label = guest.name?.trim() || `Guest ${index + 1}`;
            const category = guest.categoryLabel
                ? ` (${escapeHtml(guest.categoryLabel)})`
                : "";
            const contributionAmount = contributionRequired && guest.contributionAmount != null
                ? ` - ${formatAmount(guest.contributionAmount, currency)}`
                : "";
            return `${escapeHtml(label)}${category}${contributionAmount}`;
        });

        groupSection = renderSection(
            "Your group",
            `${renderParagraph(
                `You + ${additionalGuests.length} additional guest${additionalGuests.length > 1 ? "s" : ""}:`,
                "margin: 4px 0;",
            )}${renderList(guestRows)}`,
        );
    }

    let contributionSection = "";
    if (contributionRequired) {
        const primaryCents = contributionAmount ?? 0;
        const additionalTotal = (additionalGuests ?? []).reduce(
            (sum, guest) => sum + (guest.contributionAmount ?? 0),
            0,
        );
        const totalCents = primaryCents + additionalTotal;

        const rows: string[] = [];
        if (primaryCents > 0) {
            rows.push(
                `<tr><td style="padding: 3px 16px 3px 0;">${escapeHtml(guestName)}</td><td style="padding: 3px 0; text-align: right;">${formatAmount(primaryCents, currency)}</td></tr>`,
            );
        }

        (additionalGuests ?? []).forEach((guest, index) => {
            const label = guest.name?.trim() || `Guest ${index + 1}`;
            if (guest.contributionAmount != null && guest.contributionAmount > 0) {
                rows.push(
                    `<tr><td style="padding: 3px 16px 3px 0;">${escapeHtml(label)}</td><td style="padding: 3px 0; text-align: right;">${formatAmount(guest.contributionAmount, currency)}</td></tr>`,
                );
            }
        });

        const paymentNote = contributionPaymentInfo
            ? renderParagraph(
                `<strong>Payment instructions:</strong> ${escapeHtml(contributionPaymentInfo)}`,
                "margin: 10px 0 0 0; font-size: 14px;",
            )
            : "";

        contributionSection = renderSection(
            "Contribution",
            `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">${rows.join("")}${renderContributionTotalRow(formatAmount(totalCents, currency))}</table>${paymentNote}`,
        );
    }

    const customQuestionsSection = customQuestionResponses && customQuestionResponses.length > 0
        ? renderSection(
            "Your answers",
            renderList(
                customQuestionResponses.map(
                    (question) =>
                        `<strong>${escapeHtml(question.label)}:</strong> ${escapeHtml(question.answer)}`,
                ),
            ),
        )
        : "";

    const noteSection = rsvpNote
        ? renderSection("Your note", renderQuotedText(rsvpNote))
        : "";

    return [
        responseSection,
        eventDetailsSection,
        groupSection,
        contributionSection,
        customQuestionsSection,
        noteSection,
    ].join("");
}
