"use server";

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/services/auth/auth";
import logger from "@/lib/utils/logger";
import type { UserPreferences, GeneralSettingsInput } from "@/types/auth";
import { organizerProfileSchema, type OrganizerProfileInput } from "@/types/auth";
import {
    deleteUserAccount,
    exportUserData,
    getUserSettings,
    updateAppearance,
    updateGeneralSettings,
    updateNotificationPreferences,
    updateUserProfileImage,
} from "@/lib/services/auth/user-settings";
import {
    fetchUserByUsername,
    mapDbUserToOrganizerProfile,
    normalizeUsername,
    updateUserProfile,
} from "@/lib/services/auth/user-service";


export async function updateGeneralSettingsAction(
    payload: GeneralSettingsInput,
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to update settings." };
    }

    try {
        await updateGeneralSettings(user.id, payload);
        return { success: true };
    } catch (e) {
        logger.error("Failed to update general settings", e, {
            source: "dashboard.settings.update-general",
            userId: user.id,
        });
        return {
            success: false,
            error: "Failed to update settings.",
        };
    }
}

export async function updateAppearanceAction(
    theme: "light" | "dark" | "system",
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to update settings." };
    }

    try {
        await updateAppearance(user.id, theme);
        return { success: true };
    } catch (e) {
        logger.error("Failed to update appearance settings", e, {
            source: "dashboard.settings.update-appearance",
            userId: user.id,
        });
        return {
            success: false,
            error: "Failed to update appearance.",
        };
    }
}

export async function updateProfileImageAction(
    profileImageUrl: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to update your profile image." };
    }

    try {
        await updateUserProfileImage(user.id, profileImageUrl);
        return { success: true };
    } catch (e) {
        logger.error("Failed to update profile image", e, {
            source: "dashboard.settings.update-profile-image",
            userId: user.id,
        });
        return { success: false, error: "Failed to update profile image." };
    }
}

export async function updateNotificationsAction(
    payload: {
        notifications: Partial<UserPreferences["notifications"]>;
        whatsappPhoneNumber?: string | null;
        whatsappConsent?: boolean;
    },
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to update settings." };
    }

    try {
        await updateNotificationPreferences(user.id, payload);
        return { success: true };
    } catch (e) {
        logger.error("Failed to update notification preferences", e, {
            source: "dashboard.settings.update-notifications",
            userId: user.id,
        });
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to update notifications.",
        };
    }
}

export async function exportDataAction(
    format: "json" | "csv",
): Promise<{ success: true; data: string; filename: string } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to export data." };
    }

    try {
        const data = await exportUserData(user.id);
        const filename = `Duhuze RSVP-export-${new Date().toISOString().slice(0, 10)}`;

        if (format === "json") {
            return {
                success: true,
                data: JSON.stringify(data, null, 2),
                filename: `${filename}.json`,
            };
        }

        // CSV: user row + events + guests (flattened)
        const rows: string[] = [];
        const escape = (v: unknown) =>
            `"${String(v ?? "").replace(/"/g, '""')}"`;
        rows.push("Section,Id,Title/Name,Email,Date,Extra");
        rows.push(`User,${data.user.id},${escape(data.user.name)},${escape(data.user.email)},${data.user.createdAt},`);
        for (const e of data.events) {
            rows.push(
                `Event,${e.id},${escape(e.title)},,${e.date},${escape(e.visibility)}`,
            );
        }
        for (const g of data.guests) {
            rows.push(
                `Guest,${g.eventId},${escape(g.name)},${escape(g.email)},${g.respondedAt ?? ""},${escape(g.rsvpStatus)}`,
            );
        }
        const csv = rows.join("\n");

        return {
            success: true,
            data: csv,
            filename: `${filename}.csv`,
        };
    } catch (e) {
        logger.error("Failed to export user data", e, {
            source: "dashboard.settings.export-data",
            userId: user.id,
            format,
        });
        return {
            success: false,
            error: "Failed to export data.",
        };
    }
}

export async function updateProfileAction(
    payload: OrganizerProfileInput,
): Promise<{ error?: string; data?: ReturnType<typeof mapDbUserToOrganizerProfile> }> {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const parsed = organizerProfileSchema.parse(payload);
        const normalizedUsername = normalizeUsername(parsed.username);
        if (!normalizedUsername) {
            return { error: "Username can only contain lowercase letters, numbers, and dashes" };
        }
        if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
            return { error: "Username must be between 3 and 30 characters" };
        }
        if (normalizedUsername !== user.username) {
            const existing = await fetchUserByUsername(normalizedUsername);
            if (existing && existing.id !== user.id) {
                return { error: "Username is already taken" };
            }
        }

        await updateUserProfile(user.id, {
            username: normalizedUsername,
            displayName: parsed.displayName,
            profileImageUrl: parsed.profileImageUrl ?? null,
            coverImageUrl: parsed.coverImageUrl ?? null,
            publicEmail: parsed.publicEmail ?? null,
            phoneNumber: parsed.phoneNumber ?? null,
            tagline: parsed.tagline ?? null,
            bio: parsed.bio ?? null,
            websiteUrl: parsed.websiteUrl ?? null,
            socials: parsed.socials
                ? {
                      instagram: parsed.socials.instagram ?? null,
                      linkedin: parsed.socials.linkedin ?? null,
                      x: parsed.socials.x ?? null,
                      custom: parsed.socials.custom ?? null,
                  }
                : null,
            location: parsed.location
                ? { country: parsed.location.country, city: parsed.location.city ?? null }
                : null,
            preferredCurrency: parsed.preferredCurrency ?? null,
        });

        const updatedProfile = mapDbUserToOrganizerProfile({
            ...user,
            username: normalizedUsername,
            name: parsed.displayName,
            profileImageUrl: parsed.profileImageUrl ?? null,
            coverImageUrl: parsed.coverImageUrl ?? null,
            publicEmail: parsed.publicEmail ?? null,
            phoneNumber: parsed.phoneNumber ?? null,
            tagline: parsed.tagline ?? null,
            bio: parsed.bio ?? null,
            websiteUrl: parsed.websiteUrl ?? null,
            socials: parsed.socials
                ? {
                      instagram: parsed.socials.instagram ?? null,
                      linkedin: parsed.socials.linkedin ?? null,
                      x: parsed.socials.x ?? null,
                      custom: parsed.socials.custom ?? null,
                  }
                : null,
            location: parsed.location
                ? { country: parsed.location.country, city: parsed.location.city ?? null }
                : null,
            preferredCurrency: parsed.preferredCurrency ?? null,
        } as Parameters<typeof mapDbUserToOrganizerProfile>[0]);

        return { data: updatedProfile };
    } catch (error) {
        logger.error("Failed to update profile", error);
        return { error: "Failed to update profile" };
    }
}

export async function getDashboardSettingsData() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const settings = await getUserSettings(user.id);

    return {
        settings,
        username: user.username ?? null,
        userEmail: user.email,
    };
}

export async function getDashboardProfileData() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return mapDbUserToOrganizerProfile(user);
}

export async function deleteAccountAction(
    usernameConfirmation: string,
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "You must be signed in to delete your account." };
    }

    const normalized = usernameConfirmation.trim().toLowerCase();
    const expectedUsername = (user.username ?? "").toLowerCase();
    const expectedEmail = (user.email ?? "").toLowerCase();
    const matches =
        expectedUsername && normalized === expectedUsername
            ? true
            : normalized === expectedEmail;
    if (!matches) {
        return {
            success: false,
            error:
                user.username
                    ? "Username does not match. Type your username exactly to confirm."
                    : "Email does not match. Type your account email exactly to confirm.",
        };
    }

    try {
        await deleteUserAccount(user.id);
        const client = await clerkClient();
        await client.users.deleteUser(user.clerkId);
    } catch (e) {
        logger.error("Failed to delete user account", e, {
            source: "dashboard.settings.delete-account",
            userId: user.id,
        });
        return {
            success: false,
            error: "Failed to delete account.",
        };
    }

    redirect("/");
}
