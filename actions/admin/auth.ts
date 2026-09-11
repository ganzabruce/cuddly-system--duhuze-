"use server";

import { notFound, redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { adminUsers } from "@/lib/db/schema/admin";
import type { AdminUser } from "@/types/admin";

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const role = clerkUser.privateMetadata?.role as string | undefined;
    if (role !== "admin" && role !== "owner") return null;

    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    const dbUser = userRows[0];
    if (!dbUser) return null;

    const adminRows = await db
      .select({
        id: adminUsers.id,
        userId: adminUsers.userId,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
      })
      .from(adminUsers)
      .where(eq(adminUsers.userId, dbUser.id))
      .limit(1);

    const admin = adminRows[0];
    if (!admin) return null;

    return {
      id: admin.id,
      userId: admin.userId!,
      email: admin.email,
      name: admin.name,
      role: role as "owner" | "admin",
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return admin;
}

export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin/overview");
  return admin;
}
