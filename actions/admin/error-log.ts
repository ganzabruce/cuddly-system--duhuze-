"use server";

import db from "@/lib/db";
import { appErrorLog } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import logger from "@/lib/utils/logger";
import { requireAdmin } from "@/actions/admin/auth";
import type { ErrorLogParams, ErrorLogResult } from "@/types/admin";

const idSchema = z.number().int().positive();

/**
 * Get paginated app error log
 */
export async function getErrorLog(
    params: ErrorLogParams = {}
): Promise<ErrorLogResult> {
    await requireAdmin();

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const offset = (page - 1) * limit;

    try {
        const conditions = [];

        if (params.level) {
            conditions.push(eq(appErrorLog.level, params.level));
        }
        if (params.source) {
            conditions.push(eq(appErrorLog.source, params.source));
        }
        if (params.resolved !== undefined) {
            conditions.push(eq(appErrorLog.resolved, params.resolved));
        }
        if (params.startDate) {
            conditions.push(gte(appErrorLog.createdAt, params.startDate));
        }
        if (params.endDate) {
            conditions.push(lte(appErrorLog.createdAt, params.endDate));
        }

        const whereClause =
            conditions.length > 0 ? and(...conditions) : undefined;

        const totalResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(appErrorLog)
            .where(whereClause);

        const total = totalResult[0]?.count ?? 0;

        const results = await db
            .select()
            .from(appErrorLog)
            .where(whereClause)
            .orderBy(desc(appErrorLog.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            entries: results.map((entry) => ({
                id: entry.id,
                level: entry.level,
                message: entry.message,
                stack: entry.stack,
                context: (entry.context as Record<string, unknown> | null) ?? null,
                source: entry.source,
                userId: entry.userId,
                resolved: entry.resolved,
                resolvedAt: entry.resolvedAt,
                resolvedBy: entry.resolvedBy,
                createdAt: entry.createdAt ?? new Date(),
            })),
            total,
            page,
            limit,
        };
    } catch (error) {
        logger.error("Failed to get error log", error);
        return {
            entries: [],
            total: 0,
            page,
            limit,
        };
    }
}

/**
 * Get count of unresolved errors (for sidebar badge)
 */
export async function getUnresolvedErrorCount(): Promise<number> {
    await requireAdmin();

    try {
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(appErrorLog)
            .where(eq(appErrorLog.resolved, false));
        return result[0]?.count ?? 0;
    } catch {
        return 0;
    }
}

/**
 * Mark an error as resolved
 */
export async function resolveError(
    id: number,
    resolvedBy: string
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
        return { success: false, error: "Invalid error id" };
    }

    try {
        await db
            .update(appErrorLog)
            .set({
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy,
            })
            .where(eq(appErrorLog.id, parsedId.data));
        return { success: true };
    } catch (error) {
        logger.error("Failed to resolve error", error);
        return { success: false, error: "Failed to resolve error" };
    }
}

/**
 * Delete errors older than the given date (e.g. cleanup)
 */
export async function deleteErrorsOlderThan(
    before: Date
): Promise<{ deleted: number }> {
    await requireAdmin();

    try {
        const toDelete = await db
            .delete(appErrorLog)
            .where(lte(appErrorLog.createdAt, before))
            .returning({ id: appErrorLog.id });
        return { deleted: toDelete.length };
    } catch (error) {
        logger.error("Failed to delete old errors", error);
        return { deleted: 0 };
    }
}
