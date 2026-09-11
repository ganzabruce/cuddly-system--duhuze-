"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/actions/admin/auth";
import db from "@/lib/db";
import { adminUsers } from "@/lib/db/schema/admin";

export async function getAdminProfile() {
  const admin = await requireAdmin();
  return { name: admin.name, email: admin.email };
}

export async function updateAdminName(name: string) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 100) {
    return { success: false, error: "Name must be 1-100 characters." };
  }

  try {
    const admin = await requireAdmin();
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Not authenticated." };

    const client = await clerkClient();
    const parts = trimmed.split(" ");
    await client.users.updateUser(clerkId, {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || undefined,
    });

    await db
      .update(adminUsers)
      .set({ name: trimmed })
      .where(eq(adminUsers.id, admin.id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update name",
    };
  }
}
