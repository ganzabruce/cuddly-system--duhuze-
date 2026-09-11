import { eq, inArray } from "drizzle-orm";
import db from "@/lib/db";
import { events, guests, users } from "@/lib/db/schema";
import type { ExportedUserData, UserLocation, UserPreferences, UserSettings } from "@/types/auth";
import { parseUserPreferences, userPreferencesSchema } from "@/types/auth";
import { DEFAULT_TIMEZONE_ID } from "@/lib/utils/timezones";
import { ValidationError } from "@/lib/utils/errors";
import { normalizeE164PhoneNumber } from "@/lib/utils/phone";

export type { UserSettings };

export async function getUserSettings(userId: number): Promise<UserSettings | null> {
    const [row] = await db
        .select({
            preferredCurrency: users.preferredCurrency,
            location: users.location,
            timezone: users.timezone,
            preferences: users.preferences,
            whatsappPhoneNumber: users.whatsappPhoneNumber,
            whatsappConsentAt: users.whatsappConsentAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!row) return null;

    const location = (row.location as UserLocation) ?? null;
    const preferences = parseUserPreferences(row.preferences);

    return {
        preferredCurrency: row.preferredCurrency ?? null,
        location,
        timezone: row.timezone ?? DEFAULT_TIMEZONE_ID,
        preferences,
        whatsappPhoneNumber: row.whatsappPhoneNumber ?? null,
        whatsappConsentAt:
            row.whatsappConsentAt instanceof Date
                ? row.whatsappConsentAt.toISOString()
                : row.whatsappConsentAt
                  ? String(row.whatsappConsentAt)
                  : null,
    };
}

export type UpdateGeneralSettingsInput = {
    preferredCurrency?: string | null;
    location?: UserLocation | null;
    timezone?: string | null;
    dateFormat?: "12h" | "24h";
};

export async function updateGeneralSettings(
    userId: number,
    input: UpdateGeneralSettingsInput,
): Promise<void> {
    const [existing] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const currentPrefs = parseUserPreferences(existing?.preferences ?? null);
    const updateData: Record<string, unknown> = {};

    if (input.preferredCurrency !== undefined) {
        updateData.preferredCurrency = input.preferredCurrency || null;
    }
    if (input.location !== undefined) {
        updateData.location = input.location;
    }
    if (input.timezone !== undefined) {
        updateData.timezone = input.timezone || null;
    }
    if (input.dateFormat !== undefined) {
        updateData.preferences = userPreferencesSchema.parse({
            ...currentPrefs,
            dateFormat: input.dateFormat,
        });
    }

    if (Object.keys(updateData).length === 0) return;

    await db
        .update(users)
        .set(updateData as Record<string, unknown>)
        .where(eq(users.id, userId));
}

export async function updateAppearance(
    userId: number,
    theme: "light" | "dark" | "system",
): Promise<void> {
    const [existing] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const currentPrefs = parseUserPreferences(existing?.preferences ?? null);
    const nextPrefs = userPreferencesSchema.parse({
        ...currentPrefs,
        theme,
    });

    await db
        .update(users)
        .set({ preferences: nextPrefs })
        .where(eq(users.id, userId));
}

export async function updateUserProfileImage(
    userId: number,
    profileImageUrl: string | null,
): Promise<void> {
    await db
        .update(users)
        .set({ profileImageUrl })
        .where(eq(users.id, userId));
}

export async function updateNotificationPreferences(
    userId: number,
    input: {
        notifications: Partial<UserPreferences["notifications"]>;
        whatsappPhoneNumber?: string | null;
        whatsappConsent?: boolean;
    },
): Promise<void> {
    const [existing] = await db
        .select({
            preferences: users.preferences,
            whatsappPhoneNumber: users.whatsappPhoneNumber,
            whatsappConsentAt: users.whatsappConsentAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const currentPrefs = parseUserPreferences(existing?.preferences ?? null);
    const nextPrefs = userPreferencesSchema.parse({
        ...currentPrefs,
        notifications: { ...currentPrefs.notifications, ...input.notifications },
    });
    const nextWhatsappPhoneNumber =
        input.whatsappPhoneNumber !== undefined
            ? (input.whatsappPhoneNumber
                  ? normalizeE164PhoneNumber(input.whatsappPhoneNumber)
                  : null)
            : (existing?.whatsappPhoneNumber ?? null);

    if (input.whatsappPhoneNumber && !nextWhatsappPhoneNumber) {
        throw new ValidationError(
            "WhatsApp number must be in E.164 format, for example +2507...",
        );
    }

    if (nextPrefs.notifications.whatsapp && !nextWhatsappPhoneNumber) {
        throw new ValidationError(
            "Add a valid WhatsApp number before enabling WhatsApp notifications.",
        );
    }

    if (
        nextPrefs.notifications.whatsapp &&
        input.whatsappConsent !== true &&
        !existing?.whatsappConsentAt
    ) {
        throw new ValidationError(
            "You must confirm consent before enabling WhatsApp notifications.",
        );
    }

    const nextWhatsappConsentAt =
        nextWhatsappPhoneNumber == null
            ? null
            : input.whatsappConsent === false
              ? null
            : nextPrefs.notifications.whatsapp
              ? (input.whatsappConsent === true
                    ? new Date()
                    : (existing?.whatsappConsentAt ?? new Date()))
              : (existing?.whatsappConsentAt ?? null);

    await db
        .update(users)
        .set({
            preferences: nextPrefs,
            whatsappPhoneNumber: nextWhatsappPhoneNumber,
            whatsappConsentAt: nextWhatsappConsentAt,
        })
        .where(eq(users.id, userId));
}

/** Deletes the user and all related data (events cascade to guests, etc.). Does not touch Clerk. */
export async function deleteUserAccount(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
}

export async function exportUserData(userId: number): Promise<ExportedUserData> {
    const [userRow] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!userRow) {
        throw new Error("User not found");
    }

    const userEvents = await db
        .select()
        .from(events)
        .where(eq(events.createdBy, userId))
        .orderBy(events.createdAt);

    const eventIds = userEvents.map((e) => e.id);
    const guestsForUser =
        eventIds.length > 0
            ? await db
                  .select()
                  .from(guests)
                  .where(inArray(guests.eventId, eventIds))
            : [];

    return {
        exportedAt: new Date().toISOString(),
        user: {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name,
            username: userRow.username ?? null,
            preferredCurrency: userRow.preferredCurrency ?? null,
            timezone: userRow.timezone ?? null,
            location: userRow.location,
            createdAt:
                userRow.createdAt instanceof Date
                    ? userRow.createdAt.toISOString()
                    : String(userRow.createdAt),
        },
        events: userEvents.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description ?? null,
            date:
                e.date instanceof Date ? e.date.toISOString() : String(e.date),
            endDate:
                e.endDate instanceof Date
                    ? e.endDate.toISOString()
                    : e.endDate
                      ? String(e.endDate)
                      : null,
            locationType: e.locationType,
            locationName: e.locationName,
            locationLink: e.locationLink ?? null,
            visibility: e.visibility,
            createdAt:
                e.createdAt instanceof Date
                    ? e.createdAt.toISOString()
                    : String(e.createdAt),
        })),
        guests: guestsForUser.map((g) => ({
            eventId: g.eventId,
            name: g.name,
            email: g.email,
            rsvpStatus: g.rsvpStatus,
            rsvpNote: g.rsvpNote ?? null,
            respondedAt:
                g.respondedAt instanceof Date
                    ? g.respondedAt.toISOString()
                    : g.respondedAt
                      ? String(g.respondedAt)
                      : null,
            createdAt:
                g.createdAt instanceof Date
                    ? g.createdAt.toISOString()
                    : String(g.createdAt),
        })),
    };
}
