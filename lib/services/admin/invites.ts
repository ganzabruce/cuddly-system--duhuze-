import { desc } from "drizzle-orm";
import db from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import type { AdminMember, AdminRole } from "@/types/admin";

export async function listAdmins(): Promise<AdminMember[]> {
  const rows = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      status: adminUsers.status,
      createdBy: adminUsers.createdBy,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  return rows.map((row) => ({
    ...row,
    role: row.role as AdminRole,
    status: row.status as "active" | "disabled",
  }));
}
