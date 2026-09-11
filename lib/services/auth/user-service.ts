import type { User as ClerkUser } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { DbUser, OrganizerProfile, UserLocation, UserSocials } from "@/types/auth";

export type { DbUser };

/**
 * Ensures that a corresponding database user exists for the given Clerk user.
 * If the user already exists, it is returned as-is; otherwise, a new record is created.
 */
export async function ensureUserForClerkUser(
    clerkUser: ClerkUser,
): Promise<DbUser> {
    if (!clerkUser?.id) {
        throw new Error("Clerk user is missing an id");
    }

    const existing = await fetchUserByClerkId(clerkUser.id);
    if (existing) {
        return existing;
    }

    const email = pickPrimaryEmail(clerkUser) ?? buildSyntheticEmail(clerkUser);
    const name = buildDisplayName(clerkUser, email);
    const normalizedUsername = normalizeUsername(clerkUser.username);

    const [created] = await db
        .insert(users)
        .values({
            clerkId: clerkUser.id,
            email,
            name,
            username: normalizedUsername,
            profileImageUrl: clerkUser.imageUrl,
        })
        .onConflictDoUpdate({
            target: users.email,
            set: { clerkId: clerkUser.id },
        })
        .returning();

    return created;
}

/**
 * Fetches a database user by ID.
 */
export async function getUserById(id: number): Promise<DbUser | null> {
    const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    return result[0] ?? null;
}

/**
 * Fetches a database user by Clerk ID (auth provider id).
 */
export async function fetchUserByClerkId(
    clerkId: string,
): Promise<DbUser | null> {
    const result = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

    return result[0] ?? null;
}

/**
 * Updates the username for a user by database user id.
 */
export async function updateUserUsername(
    userId: number,
    username: string,
): Promise<void> {
    await db
        .update(users)
        .set({ username })
        .where(eq(users.id, userId));
}

/**
 * Updates profile fields for a user by database user id.
 */
export async function updateUserProfile(
    userId: number,
    data: {
        username?: string;
        firstName?: string;
        lastName?: string | null;
        displayName?: string;
        profileImageUrl?: string | null;
        coverImageUrl?: string | null;
        publicEmail?: string | null;
        phoneNumber?: string | null;
        tagline?: string | null;
        bio?: string | null;
        websiteUrl?: string | null;
        socials?: UserSocials;
        location?: UserLocation;
        preferredCurrency?: string | null;
    },
): Promise<void> {
    const updateData: Partial<typeof users.$inferInsert> = {};

    if (data.username) {
        updateData.username = data.username;
    }
    if (data.displayName) {
        updateData.name = data.displayName;
    } else if (data.firstName) {
        updateData.name = data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.firstName;
    }

    if (data.profileImageUrl !== undefined) {
        updateData.profileImageUrl = data.profileImageUrl || null;
    }
    if (data.coverImageUrl !== undefined) {
        updateData.coverImageUrl = data.coverImageUrl || null;
    }
    if (data.publicEmail !== undefined) {
        updateData.publicEmail = data.publicEmail || null;
    }
    if (data.phoneNumber !== undefined) {
        updateData.phoneNumber = data.phoneNumber || null;
    }
    if (data.tagline !== undefined) {
        updateData.tagline = data.tagline || null;
    }
    if (data.bio !== undefined) {
        updateData.bio = data.bio || null;
    }
    if (data.websiteUrl !== undefined) {
        updateData.websiteUrl = data.websiteUrl || null;
    }
    if (data.socials !== undefined) {
        updateData.socials = data.socials;
    }
    if (data.location !== undefined) {
        updateData.location = data.location;
    }
    if (data.preferredCurrency !== undefined) {
        updateData.preferredCurrency = data.preferredCurrency || null;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
}

export function mapDbUserToOrganizerProfile(user: DbUser): OrganizerProfile {
    return {
        id: user.id,
        name: user.name,
        username: user.username ?? null,
        email: user.email,
        publicEmail: user.publicEmail ?? null,
        phoneNumber: user.phoneNumber ?? null,
        tagline: user.tagline ?? null,
        bio: user.bio ?? null,
        websiteUrl: user.websiteUrl ?? null,
        socials: (user.socials as UserSocials | null) ?? null,
        location: (user.location as UserLocation | null) ?? null,
        preferredCurrency: user.preferredCurrency ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
        coverImageUrl: user.coverImageUrl ?? null,
    };
}

/**
 * Fetches a database user by username (case-insensitive).
 */
export async function fetchUserByUsername(
    username: string,
): Promise<DbUser | null> {
    const normalized = normalizeUsername(username);
    if (!normalized) {
        return null;
    }

    const result = await db
        .select()
        .from(users)
        .where(eq(users.username, normalized))
        .limit(1);

    return result[0] ?? null;
}

/**
 * Normalizes usernames to match the validation rules (lowercase letters, numbers, and dashes only).
 */
export function normalizeUsername(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return null;
    }

    if (!/^[a-z0-9-]+$/.test(normalized)) {
        return null;
    }

    return normalized;
}

function pickPrimaryEmail(clerkUser: ClerkUser): string | null {
    const primaryId = clerkUser.primaryEmailAddressId;
    if (primaryId) {
        const primary = clerkUser.emailAddresses.find(
            (address) => address.id === primaryId,
        );
        if (primary?.emailAddress) {
            return primary.emailAddress;
        }
    }

    return (
        clerkUser.emailAddresses.find((address) => address.emailAddress?.length)
            ?.emailAddress ?? null
    );
}

function buildDisplayName(clerkUser: ClerkUser, fallbackEmail: string): string {
    const first = clerkUser.firstName?.trim() ?? "";
    const last = clerkUser.lastName?.trim() ?? "";
    const fullName = [first, last].filter(Boolean).join(" ");

    return (
        fullName ||
        clerkUser.username?.trim() ||
        fallbackEmail ||
        "Anonymous Duhuze RSVP User"
    );
}

function buildSyntheticEmail(clerkUser: ClerkUser): string {
    return `${clerkUser.id}@placeholder.Duhuze RSVP.local`;
}
