"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import db from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import type { OrganizerRow, PublicEventRow } from "@/types/public-profile";

const organizerSocialsSchema = z.object({
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  x: z.string().optional(),
  custom: z.string().optional(),
});

const organizerLocationSchema = z.object({
  country: z.string(),
  city: z.object({ name: z.string() }).nullish(),
});

function wrapProfileDbError(username: string, err: unknown): Error {
  return new Error(`Failed to load profile for @${username}`, { cause: err });
}

// PUBLIC ACTION — no auth by design (exposes only public organizer profile fields)
export async function getOrganizerRow(
  username: string,
): Promise<OrganizerRow | null> {
  try {
    const userRows = await db
      .select({
        name: users.name,
        publicEmail: users.publicEmail,
        profileImageUrl: users.profileImageUrl,
        coverImageUrl: users.coverImageUrl,
        tagline: users.tagline,
        bio: users.bio,
        websiteUrl: users.websiteUrl,
        phoneNumber: users.phoneNumber,
        socials: users.socials,
        location: users.location,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const row = userRows[0];
    if (!row) return null;

    return {
      ...row,
      socials: organizerSocialsSchema.safeParse(row.socials).data ?? null,
      location: organizerLocationSchema.safeParse(row.location).data ?? null,
    };
  } catch (err) {
    throw wrapProfileDbError(username, err);
  }
}

// PUBLIC ACTION — no auth by design (only publicly-visible, published events)
export async function getPublicEvents(
  username: string,
): Promise<PublicEventRow[]> {
  try {
    return await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        date: events.date,
        locationName: events.locationName,
        locationLink: events.locationLink,
        image: events.image,
        imageFormat: events.imageFormat,
        slug: events.slug,
      })
      .from(events)
      .where(
        and(
          eq(events.username, username),
          eq(events.visibility, "public"),
          inArray(events.status, ["published", "completed"]),
        ),
      )
      .orderBy(desc(events.date))
      .limit(50);
  } catch (err) {
    throw wrapProfileDbError(username, err);
  }
}

// PUBLIC ACTION — no auth by design (composes public organizer + event data above)
export async function getOrganizerProfileData(username: string) {
  const [user, publicEvents] = await Promise.all([
    getOrganizerRow(username),
    getPublicEvents(username),
  ]);

  return { user, publicEvents };
}
