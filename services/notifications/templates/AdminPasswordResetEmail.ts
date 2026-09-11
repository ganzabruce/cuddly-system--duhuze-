import { renderLayout } from "./BaseEmailLayout";
import { escapeHtml, firstParagraphStyle } from "./email-styles";
import { EMAIL_BRAND_NAME } from "@/lib/constants/brand";
import {
    renderActionButton,
    renderFallbackLink,
    renderMutedParagraph,
    renderParagraph,
} from "./email-blocks";

export interface AdminPasswordResetContent {
    resetLink: string;
}

export function adminPasswordResetEmailHtml(params: AdminPasswordResetContent): string {
    const { resetLink } = params;

    return renderLayout({
        preheader: `Reset your ${EMAIL_BRAND_NAME} admin password`,
        heading: "Password reset",
        bodyHtml: `${renderParagraph("Hi,", firstParagraphStyle)}
${renderParagraph(`We received a request to reset your ${escapeHtml(EMAIL_BRAND_NAME)} admin password. Click the button below to set a new password.`)}
${renderActionButton("Reset password", resetLink)}
${renderMutedParagraph("This link expires in 1 hour.")}
${renderFallbackLink(resetLink)}
${renderMutedParagraph("If you did not request a password reset, you can safely ignore this email. Your password will not be changed.")}`,
    });
}
