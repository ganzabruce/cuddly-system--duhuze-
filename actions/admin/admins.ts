"use server";

import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { requireOwner, requireAdmin } from "@/actions/admin/auth";
import { listAdmins } from "@/lib/services/admin/invites";
import db from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { adminUsers } from "@/lib/db/schema/admin";
import logger from "@/lib/utils/logger";

export async function getAdminsPageDataAction() {
  const currentAdmin = await requireAdmin();
  const admins = await listAdmins();

  return {
    currentAdmin,
    admins: admins.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
  };
}

async function getClerkIdForAdmin(adminId: number): Promise<{ clerkId: string; userId: number }> {
  const rows = await db
    .select({ userId: adminUsers.userId, clerkId: users.clerkId })
    .from(adminUsers)
    .innerJoin(users, eq(adminUsers.userId, users.id))
    .where(eq(adminUsers.id, adminId))
    .limit(1);

  const row = rows[0];
  if (!row || !row.userId) throw new Error("Admin user not found");
  return { clerkId: row.clerkId, userId: row.userId };
}

export async function grantAdminRoleAction(
  email: string,
  role: "owner" | "admin",
): Promise<{ success: boolean; error?: string }> {
  try {
    const me = await requireOwner();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: "Email is required." };

    const existingAdmin = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      return { success: false, error: "This user is already an admin." };
    }

    const userRows = await db
      .select({ id: users.id, clerkId: users.clerkId, name: users.name })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      return { success: false, error: "No user found with this email. They must have an account first." };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkId, {
      privateMetadata: { role },
    });

    try {
      await db.insert(adminUsers).values({
        userId: user.id,
        email: normalizedEmail,
        name: user.name,
        role,
        status: "active",
        createdBy: me.id,
      });
    } catch (dbError) {
      logger.error("Failed to sync admin role to DB after Clerk update", dbError, {
        email: normalizedEmail,
        role,
      });
      return { success: true, error: "Role granted in auth but failed to sync to database. Contact support." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to grant admin role." };
  }
}

export async function revokeAdminRoleAction(
  adminId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const me = await requireOwner();
    if (me.id === adminId) return { success: false, error: "You cannot revoke your own access." };

    const { clerkId } = await getClerkIdForAdmin(adminId);

    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      privateMetadata: { role: null },
    });

    try {
      await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
    } catch (dbError) {
      logger.error("Failed to remove admin from DB after Clerk update", dbError, { adminId });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to revoke admin role." };
  }
}

export async function promoteAdminAction(
  adminId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const me = await requireOwner();
    if (me.id === adminId) return { success: false, error: "You are already an owner." };

    const { clerkId } = await getClerkIdForAdmin(adminId);

    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      privateMetadata: { role: "owner" },
    });

    try {
      await db.update(adminUsers).set({ role: "owner" }).where(eq(adminUsers.id, adminId));
    } catch (dbError) {
      logger.error("Failed to sync promotion to DB after Clerk update", dbError, { adminId });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to promote admin." };
  }
}

export async function demoteAdminAction(
  adminId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const me = await requireOwner();
    if (me.id === adminId) return { success: false, error: "You cannot demote yourself." };

    const { clerkId } = await getClerkIdForAdmin(adminId);

    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      privateMetadata: { role: "admin" },
    });

    try {
      await db.update(adminUsers).set({ role: "admin" }).where(eq(adminUsers.id, adminId));
    } catch (dbError) {
      logger.error("Failed to sync demotion to DB after Clerk update", dbError, { adminId });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to demote admin." };
  }
}
