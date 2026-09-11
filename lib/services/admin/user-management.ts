import { z } from "zod";
import db from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { desc, eq, sql, SQL } from "drizzle-orm";
import logger from "@/lib/utils/logger";
import { logAdminAction } from "@/lib/services/admin/audit-log";
import type {
  AdminUserDetail,
  UserListParams,
  UserListResult,
  UserLocation,
  UserPreferences,
  UserWithStats,
} from "@/types/admin";

const userIdSchema = z.number().int().positive();
const usernameSchema = z.string().trim().min(1);
const userListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(200).optional(),
  search: z.string().optional(),
  status: z.enum(["ok", "suspended"]).optional(),
});

const userListFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  status: users.status,
  suspendedAt: users.suspendedAt,
  suspendedReason: users.suspendedReason,
  createdAt: users.createdAt,
};

function buildWhereClause(params: UserListParams): SQL | undefined {
  const conditions: SQL[] = [];
  if (params.status === "ok" || params.status === "suspended") {
    conditions.push(eq(users.status, params.status));
  }
  if (params.search?.trim()) {
    const term = `%${params.search.toLowerCase().trim()}%`;
    conditions.push(
      sql`(LOWER(${users.name}) LIKE ${term} OR LOWER(${users.email}) LIKE ${term} OR LOWER(${users.username}) LIKE ${term})`,
    );
  }
  return conditions.length ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
}

export async function getUserList(params: UserListParams = {}): Promise<UserListResult> {
  const parsed = userListParamsSchema.parse(params);
  const page = parsed.page ?? 1;
  const limit = parsed.limit ?? 20;
  const offset = (page - 1) * limit;
  const where = buildWhereClause(parsed);

  try {
    const selectWithCount = {
      ...userListFields,
      eventsCount: sql<number>`count(${events.id})::int`,
    };
    const groupByCols = [
      users.id,
      users.name,
      users.email,
      users.username,
      users.status,
      users.suspendedAt,
      users.suspendedReason,
      users.createdAt,
    ] as const;

    const listQuery = (where
      ? db
          .select(selectWithCount)
          .from(users)
          .leftJoin(events, eq(users.id, events.createdBy))
          .where(where)
          .groupBy(...groupByCols)
      : db
          .select(selectWithCount)
          .from(users)
          .leftJoin(events, eq(users.id, events.createdBy))
          .groupBy(...groupByCols)
    )
      .orderBy(desc(sql`count(${events.id})`))
      .limit(limit)
      .offset(offset);

    const [totalResult, userRows] = await Promise.all([
      where
        ? db.select({ count: sql<number>`count(*)::int` }).from(users).where(where)
        : db.select({ count: sql<number>`count(*)::int` }).from(users),
      listQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;
    const usersWithStats: UserWithStats[] = userRows.map((u) => ({
      ...u,
      eventsCount: u.eventsCount ?? 0,
    }));

    return {
      users: usersWithStats,
      total,
      page,
      limit,
    };
  } catch (error) {
    logger.error("Failed to get user list", error);
    return { users: [], total: 0, page, limit };
  }
}

function toAdminUserDetail(u: typeof users.$inferSelect, eventsCount: number): AdminUserDetail {
  const { clerkId, ...rest } = u;
  void clerkId;
  return {
    ...rest,
    eventsCount,
    location: u.location as UserLocation,
    preferences: u.preferences as UserPreferences,
  } as AdminUserDetail;
}

export async function getAdminUserDetail(userId: number): Promise<AdminUserDetail | null> {
  const parsedId = userIdSchema.parse(userId);
  try {
    const [rows, countRows] = await Promise.all([
      db.select().from(users).where(eq(users.id, parsedId)).limit(1),
      db.select({ eventsCount: sql<number>`count(*)::int` }).from(events).where(eq(events.createdBy, parsedId)),
    ]);

    if (rows.length === 0) return null;
    return toAdminUserDetail(rows[0], countRows[0]?.eventsCount ?? 0);
  } catch (error) {
    logger.error("Failed to get admin user detail", error);
    return null;
  }
}

export async function getAdminUserDetailByUsername(username: string): Promise<AdminUserDetail | null> {
  const parsedUsername = usernameSchema.parse(username);
  try {
    const rows = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${parsedUsername})`)
      .limit(1);

    if (rows.length === 0) return null;

    const u = rows[0];
    const [countRows] = await Promise.all([
      db.select({ eventsCount: sql<number>`count(*)::int` }).from(events).where(eq(events.createdBy, u.id)),
    ]);

    return toAdminUserDetail(u, countRows[0]?.eventsCount ?? 0);
  } catch (error) {
    logger.error("Failed to get admin user detail by username", error);
    return null;
  }
}

export async function suspendUser(
  userId: number,
  adminEmail: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const parsedId = userIdSchema.parse(userId);
  try {
    const user = await getAdminUserDetail(parsedId);
    if (!user) return { success: false, error: "User not found" };
    if (user.status === "suspended") return { success: false, error: "User is already suspended" };

    await db
      .update(users)
      .set({ status: "suspended", suspendedAt: new Date(), suspendedReason: reason })
      .where(eq(users.id, parsedId));

    await logAdminAction({
      adminEmail,
      action: "user.suspend",
      targetType: "user",
      targetId: String(parsedId),
      details: { reason, userId: parsedId, userEmail: user.email },
    });
    return { success: true };
  } catch (error) {
    logger.error("Failed to suspend user", error);
    return { success: false, error: "Failed to suspend user" };
  }
}

export async function unsuspendUser(
  userId: number,
  adminEmail: string,
): Promise<{ success: boolean; error?: string }> {
  const parsedId = userIdSchema.parse(userId);
  try {
    const user = await getAdminUserDetail(parsedId);
    if (!user) return { success: false, error: "User not found" };
    if (user.status === "ok") return { success: false, error: "User is not suspended" };

    await db
      .update(users)
      .set({ status: "ok", suspendedAt: null, suspendedReason: null })
      .where(eq(users.id, parsedId));

    await logAdminAction({
      adminEmail,
      action: "user.unsuspend",
      targetType: "user",
      targetId: String(parsedId),
      details: { userId: parsedId, userEmail: user.email },
    });
    return { success: true };
  } catch (error) {
    logger.error("Failed to unsuspend user", error);
    return { success: false, error: "Failed to unsuspend user" };
  }
}
