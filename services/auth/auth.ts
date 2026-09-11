import { cache } from "react";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import {
    ensureUserForClerkUser,
    fetchUserByClerkId,
} from "@/lib/services/auth/user-service";
import type { DbUser } from "@/types/auth";
import logger from "@/lib/utils/logger";
import { DbDependencyError, isDbDependencyError } from "@/lib/db/errors";

/**
 * Auth layer: all auth-provider (Clerk) usage is confined here.
 * App code should only use getCurrentUser() and never reference the provider.
 */

export const getCurrentUser = cache(async function getCurrentUser(): Promise<DbUser | null> {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const existing = await fetchUserByClerkId(userId);
        if (existing) {
            // Check user status - suspended users should be redirected
            if (existing.status === "suspended") {
                return existing; // Return user but caller should check status and redirect
            }
            return existing;
        }

        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const newUser = await ensureUserForClerkUser(clerkUser);
        // Check status for newly created users too
        if (newUser.status === "suspended") {
            return newUser; // Return user but caller should check status and redirect
        }
        return newUser;
    } catch (error) {
        logger.error("getCurrentUser failed (database or auth)", error, {
            clerkUserId: userId,
        });
        if (isDbDependencyError(error)) {
            throw error;
        }
        throw new DbDependencyError("Failed to read current user", { cause: error });
    }
});

export async function getClerkUserNames(): Promise<{ firstName: string; lastName: string }> {
    const clerkUser = await currentUser();
    return {
        firstName: clerkUser?.firstName ?? "",
        lastName: clerkUser?.lastName ?? "",
    };
}

/**
 * Sync profile to the auth provider (e.g. username/name in Clerk).
 * Only used when our DB is source of truth and we push to the provider.
 */
export async function syncProfileToAuthProvider(
    dbUser: DbUser,
    data: {
        username: string;
        firstName: string;
        lastName?: string;
    },
): Promise<void> {
    const client = await clerkClient();
    await client.users.updateUser(dbUser.clerkId, {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
    });
}
