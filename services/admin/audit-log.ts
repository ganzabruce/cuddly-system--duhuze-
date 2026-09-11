import db from "@/lib/db";
import { adminAuditLog } from "@/lib/db/schema";
import { eq, desc, sql, gte, lte } from "drizzle-orm";
import logger from "@/lib/utils/logger";
import type { AuditLogParams, AuditLogResult } from "@/types/admin";

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(data: {
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      adminEmail: data.adminEmail,
      action: data.action,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      details: data.details ?? null,
    });
  } catch (error) {
    logger.error("Failed to log admin action", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Get paginated audit log entries
 */
export async function getAuditLog(
  params: AuditLogParams = {},
): Promise<AuditLogResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (params.action) {
      conditions.push(eq(adminAuditLog.action, params.action));
    }
    if (params.targetType) {
      conditions.push(eq(adminAuditLog.targetType, params.targetType));
    }
    if (params.startDate) {
      conditions.push(gte(adminAuditLog.createdAt, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(adminAuditLog.createdAt, params.endDate));
    }

    const whereClause =
      conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminAuditLog)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const results = await db
      .select()
      .from(adminAuditLog)
      .where(whereClause)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      entries: results.map((entry) => ({
        id: entry.id,
        adminEmail: entry.adminEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: (entry.details as Record<string, unknown> | null) ?? null,
        createdAt: entry.createdAt ?? new Date(),
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    logger.error("Failed to get audit log", error);
    return {
      entries: [],
      total: 0,
      page,
      limit,
    };
  }
}
