import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import { EMAIL_BRAND_NAME } from "@/lib/constants/brand";
import {
    renderActionButton,
    renderFallbackLink,
    renderMutedParagraph,
    renderParagraph,
} from "./email-blocks";

export interface AdminInviteContent {
    inviteLink: string;
    inviterName: string;
    role: string;
}

export function adminInviteEmailHtml(params: AdminInviteContent): string {
    const { inviteLink, inviterName, role } = params;
    const roleLabel = role === "owner" ? "Owner" : "Admin";

    return renderLayout({
        preheader: `${inviterName} invited you to ${EMAIL_BRAND_NAME}`,
        heading: "Admin account invitation",
        bodyHtml: `${renderParagraph("Hi,", firstParagraphStyle)}
${renderParagraph(`<strong>${escapeHtml(inviterName)}</strong> has invited you to join ${escapeHtml(EMAIL_BRAND_NAME)} as an <strong>${escapeHtml(roleLabel)}</strong>.`)}
${renderParagraph("Click the button below to set your password and activate your account. This link expires in 24 hours.")}
${renderActionButton("Accept invitation", inviteLink)}
${renderFallbackLink(inviteLink)}
${renderMutedParagraph("If you were not expecting this invitation, you can safely ignore this email.")}`,
    });
}
