import { sql } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import db from "@/lib/db";
import { env } from "@/lib/env";
import type {
    HealthCheckResult,
    OverallHealthStatus,
    SerializedHealthCheckResult,
    ServiceCheckResult,
} from "@/types/admin";

const RESEND_API_URL = "https://api.resend.com/domains";
const CLERK_API_URL = "https://api.clerk.com/v1/instance";

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const start = Date.now();
    const result = await fn();
    return { result, latencyMs: Date.now() - start };
}

/**
 * Check PostgreSQL (Neon) with a simple query.
 */
export async function checkDatabase(): Promise<ServiceCheckResult> {
    const lastChecked = new Date();
    try {
        const { latencyMs } = await measureLatency(() =>
            db.execute(sql`SELECT 1`)
        );
        return {
            name: "PostgreSQL (Neon)",
            status: latencyMs > 2000 ? "degraded" : "healthy",
            latencyMs,
            lastChecked,
        };
    } catch (error) {
        return {
            name: "PostgreSQL (Neon)",
            status: "down",
            message: error instanceof Error ? error.message : "Connection failed",
            lastChecked,
        };
    }
}

/**
 * Check Resend API (validates API key). Skip if key not configured.
 */
export async function checkResend(): Promise<ServiceCheckResult> {
    const lastChecked = new Date();
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
        return {
            name: "Resend",
            status: "not_configured",
            message: "RESEND_API_KEY not set",
            lastChecked,
        };
    }
    try {
        const { latencyMs } = await measureLatency(async () => {
            const res = await fetch(RESEND_API_URL, {
                method: "GET",
                headers: { Authorization: `Bearer ${apiKey}` },
                cache: "no-store",
            });
            if (res.status === 401 || res.status === 403) {
                throw new Error(res.status === 401 ? "Invalid API key" : "API key restricted");
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        });
        return {
            name: "Resend",
            status: latencyMs > 3000 ? "degraded" : "healthy",
            latencyMs,
            lastChecked,
        };
    } catch (error) {
        return {
            name: "Resend",
            status: "down",
            message: error instanceof Error ? error.message : "API check failed",
            lastChecked,
        };
    }
}

/**
 * Check Clerk backend API (validates secret key).
 */
export async function checkClerk(): Promise<ServiceCheckResult> {
    const lastChecked = new Date();
    try {
        const { latencyMs } = await measureLatency(async () => {
            const res = await fetch(CLERK_API_URL, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        });
        return {
            name: "Clerk",
            status: latencyMs > 3000 ? "degraded" : "healthy",
            latencyMs,
            lastChecked,
        };
    } catch (error) {
        return {
            name: "Clerk",
            status: "down",
            message: error instanceof Error ? error.message : "API check failed",
            lastChecked,
        };
    }
}

/**
 * Check Uploadthing (images). Skip if token not configured.
 */
export async function checkUploadthing(): Promise<ServiceCheckResult> {
    const lastChecked = new Date();
    if (!env.UPLOADTHING_TOKEN) {
        return {
            name: "Uploadthing",
            status: "not_configured",
            message: "UPLOADTHING_TOKEN not set",
            lastChecked,
        };
    }
    try {
        const { latencyMs } = await measureLatency(async () => {
            const utapi = new UTApi();
            await utapi.listFiles({ limit: 1 });
        });
        return {
            name: "Uploadthing",
            status: latencyMs > 3000 ? "degraded" : "healthy",
            latencyMs,
            lastChecked,
        };
    } catch (error) {
        return {
            name: "Uploadthing",
            status: "down",
            message: error instanceof Error ? error.message : "Connection failed",
            lastChecked,
        };
    }
}

/**
 * Derive overall app health from service results.
 * Ignores "not_configured" (e.g. optional Resend). Down wins over degraded over healthy.
 */
export function getOverallStatus(result: HealthCheckResult): OverallHealthStatus {
    const relevant = result.services.filter((s) => s.status !== "not_configured");
    if (relevant.some((s) => s.status === "down")) return "down";
    if (relevant.some((s) => s.status === "degraded")) return "degraded";
    return "healthy";
}

export function serializeHealthResult(result: HealthCheckResult): SerializedHealthCheckResult {
    return {
        ...result,
        checkedAt: result.checkedAt.toISOString(),
        services: result.services.map((s) => ({
            ...s,
            lastChecked: s.lastChecked.toISOString(),
        })),
    };
}

/**
 * Run all health checks and return results.
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
    const [database, resend, clerk, uploadthing] = await Promise.all([
        checkDatabase(),
        checkResend(),
        checkClerk(),
        checkUploadthing(),
    ]);
    return {
        services: [database, resend, clerk, uploadthing],
        checkedAt: new Date(),
    };
}
