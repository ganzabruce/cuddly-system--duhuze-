import crypto from "node:crypto";

export function generateOpaqueToken(size = 24): string {
  return crypto.randomBytes(size).toString("base64url");
}

/**
 * Normalize token values that may include email/link-tracking fragments.
 * Handles values like "<token>&source=gmail..." and URL-encoded input.
 */
export function normalizeOpaqueToken(rawToken: string): string {
  if (!rawToken) return "";

  let token = rawToken.trim();

  try {
    token = decodeURIComponent(token);
  } catch {
    // Keep original token when decoding fails
  }

  token = token.replace(/&amp;/gi, "&");

  // If a full URL is accidentally passed, take the final path segment.
  if (/^https?:\/\//i.test(token)) {
    try {
      const url = new URL(token);
      const segments = url.pathname.split("/").filter(Boolean);
      token = segments.at(-1) ?? token;
    } catch {
      // Ignore URL parse failures and continue with raw token
    }
  }

  token = token.split(/[?#&]/)[0] ?? "";

  const matched = token.match(/^[A-Za-z0-9_-]+/);
  return matched?.[0] ?? token;
}
