export const tw = {
    foreground: "#0a0a0a",
    background: "#f4f1eb",
    panel: "#ffffff",
    panelAlt: "#f5f2ea",
    border: "#ddd7ca",
    primary: "#d4af37",
    primaryHover: "#b8960f",
    primaryForeground: "#18181b",
    mutedForeground: "#78716c",
    dark: "#1c1a16",
    darkMuted: "#a09a8f",
} as const;

const bodyFontStack =
    "'Outfit', 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const headingFontStack =
    "'Newsreader', Georgia, 'Times New Roman', serif";
export const serifFontStack =
    "'Newsreader', Georgia, 'Times New Roman', serif";

/* ── Page & container ─────────────────────────────── */
export const pageStyle = `margin: 0; padding: 32px 12px; background-color: ${tw.background}; color: ${tw.foreground}; font-family: ${bodyFontStack};`;
export const containerStyle = `width: 100%; max-width: 600px; border: none; border-radius: 12px; overflow: hidden; background-color: ${tw.panel}; margin: 0 auto; box-shadow: 0 8px 40px rgba(10,10,10,0.08), 0 2px 8px rgba(79,49,29,0.05);`;

/* ── Dark header hero ─────────────────────────────── */
export const headerCellStyle = `padding: 36px 40px 32px 40px; background-color: ${tw.dark};`;
export const logoImageStyle = `display: block; width: 44px; height: 44px; border-radius: 10px;`;
export const logoImageCellStyle = `padding: 0 14px 0 0; vertical-align: middle;`;
export const logoTextCellStyle = `padding: 0; vertical-align: middle;`;
export const logoTextStyle = `font-size: 22px; line-height: 1.1; font-weight: 800; color: ${tw.primary}; letter-spacing: -0.01em; font-family: ${bodyFontStack};`;
export const headerTaglineStyle = `margin: 1px 0 0 0; font-size: 11px; color: ${tw.darkMuted}; font-family: ${serifFontStack}; font-style: italic; letter-spacing: 0.02em;`;
export const headingStyle = `margin: 24px 0 0 0; font-size: 30px; line-height: 1.2; color: #ffffff; font-weight: 500; font-style: italic; letter-spacing: -0.02em; font-family: ${headingFontStack};`;
export const headingRuleStyle = `border: none; border-top: 1.5px solid ${tw.primary}; width: 50px; margin: 14px 0 0 0;`;

/* ── Content ──────────────────────────────────────── */
export const contentCellStyle = `padding: 32px 40px; font-size: 16px; line-height: 1.7; color: ${tw.foreground};`;
export const paragraphStyle = `margin: 0 0 16px 0;`;
export const firstParagraphStyle = `margin: 0 0 16px 0;`;
export const compactParagraphStyle = `margin: 4px 0;`;
export const mutedStyle = `color: ${tw.mutedForeground}; font-size: 13px; line-height: 1.6;`;
export const mutedParagraphStyle = `${mutedStyle}; margin: 0 0 12px 0;`;
export const centeredMutedStyle = `${mutedStyle}; margin: 0; text-align: center;`;
export const linkStyle = `color: ${tw.primaryHover}; text-decoration: underline; word-break: break-all;`;

/* ── CTA button ───────────────────────────────────── */
export const buttonRowStyle = `margin: 0 0 16px 0;`;
export const ctaStyle = `display: inline-block; background-color: ${tw.dark}; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; margin: 22px 0; font-weight: 600; font-size: 15px; letter-spacing: 0.04em; text-transform: uppercase; font-family: ${bodyFontStack};`;

/* ── Section headings & cards ─────────────────────── */
export const sectionLabelStyle = `margin: 24px 0 12px 0; padding: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${tw.primaryHover};`;
export const ornamentStyle = `color: ${tw.primary}; font-size: 8px; vertical-align: middle; margin-right: 6px;`;
export const infoCardStyle = `margin: 0 0 16px 0; padding: 16px 20px; background-color: ${tw.panelAlt}; border-radius: 8px;`;
export const statusBadgeRowStyle = `margin: 0 0 16px 0;`;
export const listStyle = `margin: 4px 0 8px 0; padding-left: 20px;`;
export const tableStyle = `font-size: 15px;`;
export const quoteStyle = `margin: 4px 0; font-style: italic; font-family: ${serifFontStack}; font-size: 17px; color: ${tw.foreground};`;

/* ── QR code ──────────────────────────────────────── */
export const qrWrapStyle = `margin: 24px 0 10px 0; padding: 20px; border: 1px solid ${tw.border}; border-radius: 10px; background: ${tw.panelAlt}; text-align: center;`;
export const qrImageStyle = `display: block; max-width: 100%; height: auto; margin: 0 auto 10px auto;`;

/* ── Dark footer ──────────────────────────────────── */
export const footerCellStyle = `padding: 28px 40px 32px 40px; font-size: 13px; line-height: 1.55; color: ${tw.darkMuted}; background-color: ${tw.dark};`;

/* ── Utility ──────────────────────────────────────── */
export const preheaderStyle = `display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;`;

export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function getLogoUrl(): string {
    return "https://7jpxe7jzlc.ufs.sh/f/h1aR0mxmwHMpIK0opzYNVBF8MARqdJHXeKYsLQPC0lbjETya";
}

export const RSVP_STATUS_LABELS: Record<"yes" | "no" | "maybe", string> = {
    yes: "Attending",
    no: "Not attending",
    maybe: "Maybe",
};

/** Renders a small-caps section label with gold diamond ornament */
export function renderSectionLabel(text: string): string {
    return `<p style="${sectionLabelStyle}"><span style="${ornamentStyle}">&#9670;</span>${escapeHtml(text)}</p>`;
}
