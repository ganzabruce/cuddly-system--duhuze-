import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function isValidEmail(email: string | null | undefined): boolean {
  return (
    typeof email === "string" &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export async function generateUniqueSlug(
  title: string,
  existingSlugs: string[],
): Promise<string> {
  let slug = generateSlug(title);
  let counter = 1;
  const originalSlug = slug;

  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/** Shared formatting for dates and CSV export */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function formatDateTime(
  value: Date | string | null | undefined,
  options: { hour12?: boolean } = {},
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: options.hour12 ?? false,
  });
}

export function formatEventDate(
  value: Date | string,
  options: { hour12?: boolean; timezone?: string } = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  const locale = options.hour12 === false ? "en-US-u-hc-h23" : "en-US-u-hc-h12";
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(options.timezone && { timeZone: options.timezone }),
  });
}

export function formatEventTime(
  value: Date | string,
  options: { hour12?: boolean; timezone?: string } = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: options.hour12 ?? false,
    ...(options.timezone && { timeZone: options.timezone }),
    ...(options.timezone && { timeZoneName: "short" }),
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const normalized = String(value).replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}
