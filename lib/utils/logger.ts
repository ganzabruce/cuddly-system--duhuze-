import { DbDependencyError } from "@/lib/db/errors";

/**
 * Logging utility for the application
 *
 * In development: logs to console.
 * In production: error() and warn() also write to app_error_log (non-blocking).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
    isDevelopment: boolean;
    minLevel: LogLevel;
}

const config: LoggerConfig = {
    isDevelopment: process.env.NODE_ENV === "development",
    minLevel: process.env.NODE_ENV === "development" ? "debug" : "error",
};

const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[config.minLevel];
}

/** Extract stack and optional context from logger args for app_error_log. */
function getErrorPayload(
    level: "warn" | "error",
    message: string,
    error?: unknown,
    ...args: unknown[]
): { message: string; stack?: string | null; context?: Record<string, unknown> | null; source?: string | null } {
    const context: Record<string, unknown> = {};
    let stack: string | null = null;

    if (error instanceof Error) {
        stack = error.stack ?? null;
        context.errorName = error.name;
    } else if (error != null) {
        context.error = String(error);
    }

    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    if (lastArg && typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg)) {
        const obj = lastArg as Record<string, unknown>;
        if (typeof obj.source === "string") context.source = obj.source;
        if (typeof obj.userId === "number") context.userId = obj.userId;
        Object.assign(context, obj);
    }

    const source = (context.source as string) ?? null;
    if (typeof context.source !== "undefined") delete context.source;

    return {
        message,
        stack: stack ?? undefined,
        context: Object.keys(context).length > 0 ? context : undefined,
        source: source ?? undefined,
    };
}

/** Fire-and-forget write to app_error_log in production. Does not throw. */
const DB_LOG_SUPPRESSION_MS = 60_000;
let dbLoggingDisabledUntil = 0;

function isDbLoggingSuppressed() {
    return Date.now() < dbLoggingDisabledUntil;
}

function suppressDbLogging() {
    dbLoggingDisabledUntil = Date.now() + DB_LOG_SUPPRESSION_MS;
}

function persistToErrorLog(
    level: "warn" | "error",
    message: string,
    error?: unknown,
    ...args: unknown[]
): void {
    if (config.isDevelopment) return;
    if (error instanceof DbDependencyError) {
        suppressDbLogging();
        return;
    }
    if (isDbLoggingSuppressed()) return;

    const payload = getErrorPayload(level, message, error, ...args);
    void import("@/lib/services/admin/error-log").then(({ insertErrorLog }) => {
        insertErrorLog({
            level,
            message: payload.message,
            stack: payload.stack ?? null,
            context: payload.context ?? null,
            source: payload.source ?? null,
            userId: typeof payload.context?.userId === "number" ? payload.context.userId : undefined,
        }).catch(() => {});
    });
}

export const logger = {
    debug: (message: string, ...args: unknown[]) => {
        if (shouldLog("debug")) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    },

    info: (message: string, ...args: unknown[]) => {
        if (shouldLog("info")) {
            console.info(`[INFO] ${message}`, ...args);
        }
    },

    warn: (message: string, ...args: unknown[]) => {
        if (shouldLog("warn")) {
            console.warn(`[WARN] ${message}`, ...args);
        }
        persistToErrorLog("warn", message, args[0], ...args.slice(1));
    },

    error: (message: string, error?: unknown, ...args: unknown[]) => {
        if (shouldLog("error")) {
            console.error(`[ERROR] ${message}`, error, ...args);
        }
        persistToErrorLog("error", message, error, ...args);
    },
};

export default logger;
