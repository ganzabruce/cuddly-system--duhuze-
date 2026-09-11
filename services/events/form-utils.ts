import { getSafeExternalHref } from "@/lib/utils/url";
import sanitizeHtml from "sanitize-html";
import {
  getEventEndedAt,
  normalizeStatusValue,
} from "@/lib/utils/event-status";
import type { EventStatus } from "@/types/events";
import { IMAGE_FORMATS } from "@/lib/constants/events/constants";
import type { ImageFormat } from "@/types/events";

const VALID_IMAGE_FORMATS = Object.keys(IMAGE_FORMATS) as ImageFormat[];

export function parseImageFormat(raw: FormDataEntryValue | null): ImageFormat {
  const val = typeof raw === "string" ? raw.trim() : "";
  return VALID_IMAGE_FORMATS.includes(val as ImageFormat)
    ? (val as ImageFormat)
    : "square";
}

export function parseBoundedInteger(
  raw: FormDataEntryValue | null,
  options: {
    min: number;
    max: number;
    errorMessage: string;
    allowEmpty?: boolean;
  },
): { value: number | null; error?: string } {
  const allowEmpty = options.allowEmpty ?? true;

  if (raw == null || String(raw).trim() === "") {
    return allowEmpty
      ? { value: null }
      : { value: null, error: options.errorMessage };
  }

  const parsed = Number.parseInt(String(raw).trim(), 10);
  if (Number.isNaN(parsed) || parsed < options.min || parsed > options.max) {
    return { value: null, error: options.errorMessage };
  }

  return { value: parsed };
}

export function parseOptionalDate(raw: string | null): Date | null {
  if (!raw || raw.trim().length === 0) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeOptionalString(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim() : "";
}

export function parseContributionAmount(
  raw: FormDataEntryValue | null,
): { value: number | null; error?: string } {
  if (raw == null || raw === "" || String(raw).trim() === "") {
    return { value: null };
  }

  const parsed = Number.parseInt(String(raw).trim(), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { value: null, error: "Contribution amount must be a positive whole number" };
  }

  return { value: parsed };
}

export function validateContributionFields(params: {
  contributionRequired: boolean;
  amount: number | null;
  paymentInfo: string;
  missingAmountMessage: string;
  missingPaymentInfoMessage: string;
}): { error?: string } {
  if (!params.contributionRequired) {
    return {};
  }

  if (params.amount == null || params.amount <= 0) {
    return { error: params.missingAmountMessage };
  }

  if (!params.paymentInfo) {
    return { error: params.missingPaymentInfoMessage };
  }

  return {};
}

export function parseCheckbox(raw: FormDataEntryValue | null): boolean {
  return raw === "true" || raw === "on";
}

export function parseRsvpAccessMode(
  raw: FormDataEntryValue | null,
): "open_rsvp" | "invite_only" {
  return raw === "invite_only" ? "invite_only" : "open_rsvp";
}

export type ParsedEventCoreFields = {
  title: string;
  description: string | null;
  category: string | null;
  date: string;
  endDate: string | null;
  timezone: string;
  locationType: "in_person" | "online";
  locationName: string;
  locationLink: string | null;
  safeLocationLink: string | null;
  image: string | null;
  imageFormat: ImageFormat;
  visibility: "public" | "private";
  effectiveStatus: EventStatus;
};

export function parseEventCoreFields(
  formData: FormData,
  options: { requireLocationType: boolean },
): { value?: ParsedEventCoreFields; error?: string } {
  const title = (formData.get("title") as string) || "";
  const descriptionRaw = (formData.get("description") as string) || null;
  const description = descriptionRaw
    ? sanitizeHtml(descriptionRaw, {
        allowedTags: ["p", "strong", "em", "u", "ul", "ol", "li", "br"],
        allowedAttributes: {},
      }) || null
    : null;
  const category = (formData.get("category") as string) || null;
  const date = (formData.get("date") as string) || "";
  const endDate = (formData.get("endDate") as string) || null;
  const timezone = (formData.get("timezone") as string)?.trim() || "";
  const locationTypeRaw = (formData.get("locationType") as string) || "";
  const locationType: "in_person" | "online" | null =
    locationTypeRaw === "in_person" || locationTypeRaw === "online"
      ? locationTypeRaw
      : null;
  const locationNameRaw = (formData.get("locationName") as string) || null;
  const locationLink = (formData.get("locationLink") as string) || null;
  const image = (formData.get("image") as string) || null;
  const imageFormat = parseImageFormat(formData.get("imageFormat"));
  const visibilityRaw = (formData.get("visibility") as string) || "private";
  const visibility: "public" | "private" =
    visibilityRaw === "public" ? "public" : "private";
  const safeLocationLink = getSafeExternalHref(locationLink);

  const statusRaw = (formData.get("status") as string) || "published";
  const allowedStatuses: EventStatus[] = [
    "draft",
    "published",
    "completed",
    "cancelled",
  ];
  const statusCandidate = allowedStatuses.includes(statusRaw as EventStatus)
    ? (statusRaw as EventStatus)
    : "published";
  const sanitizedStatus =
    statusCandidate === "completed" ? "published" : statusCandidate;

  const startDate = parseOptionalDate(date);
  if (date && !startDate) {
    return { error: "Invalid event date format" };
  }
  if (!title || !date || !startDate) {
    return { error: "Title and date are required" };
  }

  const endDateValue = parseOptionalDate(endDate);
  if (endDate && !endDateValue) {
    return { error: "Invalid event end date format" };
  }
  if (endDateValue && endDateValue.getTime() < startDate.getTime()) {
    return { error: "End date must be on or after the start date" };
  }

  const eventEndedAt = getEventEndedAt({
    date: startDate,
    endDate: endDateValue,
    status: sanitizedStatus,
  });
  const normalizedStatus =
    normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

  if (
    options.requireLocationType &&
    (!locationType || !["in_person", "online"].includes(locationType))
  ) {
    return { error: "Please select a location type" };
  }
  const resolvedLocationType = locationType ?? "online";
  const locationName =
    resolvedLocationType === "online"
      ? "Online"
      : (locationNameRaw?.trim() ?? "");

  if (visibility === "public" && !category) {
    return { error: "Please select a category for public events" };
  }
  if (resolvedLocationType === "in_person" && !locationName) {
    return { error: "Venue or place name is required for in-person events" };
  }
  if (visibility === "public" && (!image || !image.trim())) {
    return { error: "An image is required for public events" };
  }
  if (locationLink?.trim() && !safeLocationLink) {
    return { error: "Location link must be a valid http(s) URL" };
  }

  return {
    value: {
      title,
      description,
      category,
      date: startDate.toISOString(),
      endDate: endDateValue ? endDateValue.toISOString() : null,
      timezone,
      locationType: resolvedLocationType,
      locationName,
      locationLink,
      safeLocationLink,
      image,
      imageFormat,
      visibility,
      effectiveStatus: normalizedStatus,
    },
  };
}
