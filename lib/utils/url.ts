import { env } from "@/lib/env";

const APP_URL_FALLBACK = "https://rsvp-duhuze.com/";

export function getAppBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return (env.APP_BASE_URL ?? APP_URL_FALLBACK).replace(/\/$/, "");
}

export function getAppDisplayHost(): string {
  const baseUrl = getAppBaseUrl();

  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "");
  }
}

const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);

/**
 * Returns a normalized external URL if it uses an allowed protocol.
 * Returns null for empty/invalid/disallowed URLs (for example javascript:).
 */
export function getSafeExternalHref(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input) {
    return null;
  }

  try {
    const parsed = new URL(input);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
