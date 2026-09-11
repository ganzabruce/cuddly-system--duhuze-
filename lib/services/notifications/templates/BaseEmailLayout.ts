import {
    tw,
    pageStyle,
    containerStyle,
    headerCellStyle,
    contentCellStyle,
    footerCellStyle,
    logoImageCellStyle,
    logoTextCellStyle,
    logoImageStyle,
    logoTextStyle,
    headerTaglineStyle,
    headingStyle,
    headingRuleStyle,
    preheaderStyle,
    serifFontStack,
    escapeHtml,
    getLogoUrl,
} from "./email-styles";
import { EMAIL_BRAND_NAME, EMAIL_BRAND_TEAM_NAME } from "@/lib/constants/brand";

export function renderLayout(params: {
    preheader: string;
    heading: string;
    bodyHtml: string;
    footerNote?: string;
}): string {
    const { preheader, heading, bodyHtml, footerNote } = params;
    const logoUrl = getLogoUrl();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500;1,600&display=swap" rel="stylesheet">
</head>
<body style="${pageStyle}">
  <span style="${preheaderStyle}">${escapeHtml(preheader)}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${containerStyle}">
          <!-- ━━ Dark header hero ━━━━━━━━━━━━━━━━━━━━━━ -->
          <tr>
            <td style="${headerCellStyle}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="${logoImageCellStyle}">
                    <img src="${logoUrl}" alt="${escapeHtml(EMAIL_BRAND_NAME)}" width="44" height="44" style="${logoImageStyle}" />
                  </td>
                  <td style="${logoTextCellStyle}">
                    <span style="${logoTextStyle}">${escapeHtml(EMAIL_BRAND_NAME)}</span>
                    <p style="${headerTaglineStyle}">Bringing people together</p>
                  </td>
                </tr>
              </table>
              <h1 style="${headingStyle}">${escapeHtml(heading)}</h1>
              <hr style="${headingRuleStyle}" />
            </td>
          </tr>
          <!-- ━━ Content ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
          <tr>
            <td style="${contentCellStyle}">
              ${bodyHtml}
            </td>
          </tr>
          <!-- ━━ Dark footer ━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
          <tr>
            <td style="${footerCellStyle}">
              <p style="margin: 0 0 12px 0; font-family: ${serifFontStack}; font-style: italic; font-size: 15px; color: ${tw.primary}; text-align: center; letter-spacing: 0.01em;">Bringing people together, one gathering at a time.</p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: ${tw.darkMuted}; text-align: center;">${escapeHtml(footerNote ?? "Need help? Reply to this email and our team will assist.")}</p>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${tw.darkMuted}; text-align: center; letter-spacing: 0.04em;">${escapeHtml(EMAIL_BRAND_TEAM_NAME)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
