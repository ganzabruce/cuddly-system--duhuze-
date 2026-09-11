import db from "@/lib/db";
import { appErrorLog } from "@/lib/db/schema";
import logger from "@/lib/utils/logger";

/**
 * Insert an error log entry.
 *
 * Internal service — called from lib/utils/logger.ts, which runs in ordinary
 * (non-admin, potentially unauthenticated) request contexts. This must NOT be
 * a guarded "use server" entry action or all error logging would break.
 */
export async function insertErrorLog(data: {
    level: "warn" | "error";
    message: string;
    stack?: string | null;
    context?: Record<string, unknown> | null;
    source?: string | null;
    userId?: number | null;
}): Promise<void> {
    try {
        await db.insert(appErrorLog).values({
            level: data.level,
            message: data.message,
            stack: data.stack ?? null,
            context: data.context ?? null,
            source: data.source ?? null,
            userId: data.userId ?? null,
        });
    } catch (err) {
        // Fire-and-forget: do not throw; avoid breaking the app if DB is down
        logger.error("[error-log] Failed to insert", err);
    }
}
