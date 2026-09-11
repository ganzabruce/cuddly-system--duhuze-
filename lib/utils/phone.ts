import {
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

export type ParsedPhone = {
  /** E.164 form, e.g. +250788123456 — the canonical stored format. */
  e164: string;
  /** ISO country, e.g. "RW". Undefined when libphonenumber can't determine it. */
  country: CountryCode | undefined;
  /** National form for display, e.g. 078 812 3456. */
  national: string;
};

const DEFAULT_COUNTRY: CountryCode = "RW";

/**
 * Parse loosely. Tries the number as typed (national for `defaultCountry`, or
 * international when it carries a country code), then falls back to treating a
 * bare digit string as international (`+<digits>`). The fallback lets legacy
 * rows stored as `250788123456` (InTouch format, no `+`) still parse without a
 * data backfill.
 */
function parseLoose(
  input: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): PhoneNumber | null {
  if (!input) return null;

  let parsed = parsePhoneNumberFromString(input, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    const digits = input.replace(/[^\d]/g, "");
    parsed = digits ? parsePhoneNumberFromString(`+${digits}`) : undefined;
  }

  return parsed && parsed.isValid() ? parsed : null;
}

/** Canonical parse → structured result, or null when the number is invalid. */
export function parsePhone(
  input: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): ParsedPhone | null {
  const parsed = parseLoose(input, defaultCountry);
  if (!parsed) return null;

  return {
    e164: parsed.number,
    country: parsed.country,
    national: parsed.formatNational(),
  };
}

/** Normalize any input to E.164, or null when invalid. Replaces the old regex. */
export function toE164(
  input: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): string | null {
  return parsePhone(input, defaultCountry)?.e164 ?? null;
}

/**
 * Strict E.164 normalization for numbers that must already carry a country code
 * (e.g. an organizer's WhatsApp number). No default country, so a bare national
 * number is rejected.
 */
export function normalizeE164PhoneNumber(value: string): string | null {
  const parsed = parsePhoneNumberFromString(value.trim());
  return parsed && parsed.isValid() ? parsed.number : null;
}

/** National form for display. Returns the input unchanged when it can't parse. */
export function formatPhoneForDisplay(input: string | null | undefined): string {
  if (!input) return "";
  return parsePhone(input)?.national ?? input;
}

// Rwandan mobile prefixes (national number, leading 0 dropped): Airtel 72/73, MTN 78/79.
const RWANDA_MOBILE_PREFIX = /^7[2389]/;

/**
 * Validate a Rwandan mobile number (MTN / Airtel) for payments and withdrawals.
 * Returns the canonical E.164 form, or null when it isn't a real RW mobile.
 *
 * Uses a prefix check rather than libphonenumber's getType(): the default
 * metadata bundle doesn't carry number-type data, and RW is the only country
 * we need to classify.
 */
export function parseRwandanMobile(
  input: string | null | undefined,
): string | null {
  const parsed = parseLoose(input);
  if (
    !parsed ||
    parsed.country !== "RW" ||
    !RWANDA_MOBILE_PREFIX.test(parsed.nationalNumber)
  ) {
    return null;
  }
  return parsed.number;
}

/** True only for valid Rwandan mobile numbers (MTN / Airtel). */
export function isRwandanMobile(phone: string | null | undefined): boolean {
  return parseRwandanMobile(phone) !== null;
}

/** E.164 (+250788123456) → InTouch API form (250788123456). */
export function toIntouchPhone(e164: string): string {
  return e164.replace(/^\+/, "");
}
