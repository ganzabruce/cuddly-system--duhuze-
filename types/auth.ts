import { z } from "zod";
import countries from "world-countries";
import { toE164 } from "@/lib/utils/phone";
import type { users } from "@/lib/db/schema";

export type DbUser = typeof users.$inferSelect;

export type UserSocials = {
    instagram?: string | null;
    linkedin?: string | null;
    x?: string | null;
    custom?: string | null;
} | null;

export type UserLocation = {
    country: string;
    city?: { name: string } | null;
} | null;

/** Editable general account settings. */
export type GeneralSettingsInput = {
    preferredCurrency?: string | null;
    location?: UserLocation | null;
    timezone?: string | null;
    dateFormat?: "12h" | "24h";
};

export type OrganizerProfile = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    publicEmail: string | null;
    phoneNumber: string | null;
    tagline: string | null;
    bio: string | null;
    websiteUrl: string | null;
    socials: UserSocials;
    location: UserLocation;
    preferredCurrency: string | null;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
};

export type UserSettings = {
    preferredCurrency: string | null;
    location: UserLocation;
    timezone: string | null;
    preferences: UserPreferences;
    whatsappPhoneNumber: string | null;
    whatsappConsentAt: string | null;
};

export type ExportedUserData = {
    exportedAt: string;
    user: {
        id: number;
        email: string;
        name: string;
        username: string | null;
        preferredCurrency: string | null;
        timezone: string | null;
        location: unknown;
        createdAt: string;
    };
    events: Array<{
        id: number;
        title: string;
        description: string | null;
        date: string;
        endDate: string | null;
        locationType: "online" | "in_person";
        locationName: string;
        locationLink: string | null;
        visibility: string;
        createdAt: string;
    }>;
    guests: Array<{
        eventId: number;
        name: string;
        email: string | null;
        rsvpStatus: string | null;
        rsvpNote: string | null;
        respondedAt: string | null;
        createdAt: string;
    }>;
};

export const notificationsPreferencesSchema = z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    whatsapp: z.boolean().default(true),
    rsvpUpdates: z.boolean().default(true),
    eventReminders: z.boolean().default(true),
    marketingUpdates: z.boolean().default(false),
});

const defaultNotifications = {
    email: true,
    push: true,
    whatsapp: true,
    rsvpUpdates: true,
    eventReminders: true,
    marketingUpdates: false,
} satisfies z.infer<typeof notificationsPreferencesSchema>;

export const userPreferencesSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    dateFormat: z.enum(["12h", "24h"]).default("24h"),
    language: z.string().default("en"), // e.g. "en", "fr", "rw"
    notifications: notificationsPreferencesSchema.default(defaultNotifications),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type NotificationsPreferences = z.infer<typeof notificationsPreferencesSchema>;

export const defaultUserPreferences: UserPreferences = {
    theme: "system",
    dateFormat: "24h",
    language: "en",
    notifications: defaultNotifications,
};

/** Parse DB preferences (may be null or partial). Returns full defaults for missing keys. */
export function parseUserPreferences(raw: unknown): UserPreferences {
    const parsed = userPreferencesSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return defaultUserPreferences;
}

// Helper to normalize optional string fields (trim and drop empty)
const optionalTrimmedString = (maxLength: number) =>
    z
        .string()
        .max(maxLength)
        .transform((val) => val.trim())
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined));

function normalizeUrl(val: string | undefined) {
    if (!val) return val;
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

const COUNTRY_CODES = new Set(countries.map((c) => c.cca2.toUpperCase()));

const CURRENCY_CODES = new Set(
    countries.flatMap((c) => (c.currencies ? Object.keys(c.currencies) : [])),
);

export const organizerSocialsSchema = z
    .object({
        instagram: optionalTrimmedString(255).transform(normalizeUrl).optional(),
        linkedin: optionalTrimmedString(255).transform(normalizeUrl).optional(),
        x: optionalTrimmedString(255).transform(normalizeUrl).optional(),
        custom: optionalTrimmedString(255).transform(normalizeUrl).optional(),
    })
    .partial()
    .optional();

export const organizerLocationSchema = z.object({
    country: z
        .string()
        .min(2, "Country code must be at least 2 characters")
        .max(2, "Use ISO 3166-1 alpha-2 country code (e.g. US, RW)")
        .transform((val) => val.toUpperCase())
        .refine((val) => COUNTRY_CODES.has(val), "Unknown country code"),
    city: z
        .object({
            name: z
                .string()
                .min(1, "City name is required")
                .max(255, "City name must be less than 255 characters"),
        })
        .optional()
        .nullable(),
});

export const organizerProfileSchema = z.object({
    displayName: z
        .string()
        .min(1, "Display name is required")
        .max(255, "Display name must be less than 255 characters"),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than 30 characters")
        .regex(
            /^[a-z0-9-]+$/,
            "Username can only contain lowercase letters, numbers, and dashes",
        ),
    tagline: optionalTrimmedString(160),
    bio: z
        .string()
        .max(2000, "Bio must be less than 2000 characters")
        .optional()
        .nullable(),
    websiteUrl: optionalTrimmedString(255).transform(normalizeUrl).optional(),
    publicEmail: z.string().email("Invalid public email").optional().nullable(),
    phoneNumber: optionalTrimmedString(50).transform((val) =>
        val ? (toE164(val) ?? undefined) : undefined,
    ),
    socials: organizerSocialsSchema,
    location: organizerLocationSchema.optional().nullable(),
    preferredCurrency: z
        .string()
        .transform((val) => val.toUpperCase())
        .refine((val) => /^[A-Z]{3}$/.test(val), "Currency must be a 3-letter code (e.g. USD, RWF)")
        .refine((val) => CURRENCY_CODES.has(val), "Unknown currency code")
        .optional()
        .nullable(),
    profileImageUrl: optionalTrimmedString(2048),
    coverImageUrl: optionalTrimmedString(2048),
});

export type OrganizerProfileInput = z.infer<typeof organizerProfileSchema>;
