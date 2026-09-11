"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEFAULT_TIMEZONE_ID } from "@/lib/utils/timezones";
import { parseUserPreferences } from "@/types/auth";

export async function formatEventDateForOrganizer(
  eventDate: Date | string,
  organizerId: number,
  eventTimezone?: string,
) {
  const [organizer] = await db
    .select({ timezone: users.timezone, preferences: users.preferences })
    .from(users)
    .where(eq(users.id, organizerId))
    .limit(1);

  const preferences = parseUserPreferences(organizer?.preferences ?? null);
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const tz = eventTimezone || organizer?.timezone || DEFAULT_TIMEZONE_ID;

  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: preferences.dateFormat !== "24h",
    timeZone: tz,
    timeZoneName: "short",
  });
}

export async function formatEventTimeForOrganizer(
  eventDate: Date | string,
  organizerId: number,
  eventTimezone?: string,
) {
  const [organizer] = await db
    .select({ timezone: users.timezone, preferences: users.preferences })
    .from(users)
    .where(eq(users.id, organizerId))
    .limit(1);

  const preferences = parseUserPreferences(organizer?.preferences ?? null);
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const tz = eventTimezone || organizer?.timezone || DEFAULT_TIMEZONE_ID;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: preferences.dateFormat !== "24h",
    timeZone: tz,
    timeZoneName: "short",
  });
}
