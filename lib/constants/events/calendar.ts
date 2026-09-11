import { stripHtml } from "@/lib/utils";

type CalendarEventInput = {
  title: string;
  description?: string | null;
  date: Date | string;
  endDate?: Date | string | null;
  locationName?: string | null;
  locationLink?: string | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toUtcCalendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function getEventEndDate(startDate: Date, endDate?: Date | string | null): Date {
  if (endDate) {
    return toDate(endDate);
  }
  return new Date(startDate.getTime() + 60 * 60 * 1000);
}

function buildLocation(locationName?: string | null, locationLink?: string | null): string {
  const name = locationName?.trim() ?? "";
  const link = locationLink?.trim() ?? "";

  if (name && link) {
    return `${name} (${link})`;
  }
  return name || link;
}

export function generateGoogleCalendarUrl(event: CalendarEventInput): string {
  const startDate = toDate(event.date);
  const endDate = getEventEndDate(startDate, event.endDate);
  const location = buildLocation(event.locationName, event.locationLink);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toUtcCalendarTimestamp(startDate)}/${toUtcCalendarTimestamp(endDate)}`,
  });

  if (event.description?.trim()) {
    params.set("details", stripHtml(event.description.trim()));
  }

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsContent(event: CalendarEventInput): string {
  const startDate = toDate(event.date);
  const endDate = getEventEndDate(startDate, event.endDate);
  const location = buildLocation(event.locationName, event.locationLink);
  const uid = `${toUtcCalendarTimestamp(startDate)}-${Math.random().toString(36).slice(2, 10)}@Duhuze RSVP.local`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Duhuze RSVP//Event RSVP//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcCalendarTimestamp(new Date())}`,
    `DTSTART:${toUtcCalendarTimestamp(startDate)}`,
    `DTEND:${toUtcCalendarTimestamp(endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description?.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(stripHtml(event.description.trim()))}`);
  }

  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.join("\r\n")}\r\n`;
}
