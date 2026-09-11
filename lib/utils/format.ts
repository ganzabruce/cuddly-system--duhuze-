import { getCurrencyByCode } from "@/lib/constants/billing/currencies";

type FormatTimeOptions = {
  hour12?: boolean;
  locale?: string;
  timeZone?: string;
};

export function getTimezoneAbbr(date: Date, timeZone?: string): string {
  if (!timeZone) return "";
  return date.toLocaleTimeString("en-US", { timeZone, timeZoneName: "short" }).split(" ").at(-1) ?? "";
}

export function formatTime(
  value: Date | string,
  options: FormatTimeOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  const { hour12 = false, locale = "en-US", timeZone } = options;

  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12,
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale = "en-US",
): string {
  const normalizedCode = currencyCode.toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const fallback = getCurrencyByCode(normalizedCode);
    const suffix = fallback?.symbol ?? normalizedCode;
    return `${amount.toLocaleString(locale)} ${suffix}`;
  }
}
