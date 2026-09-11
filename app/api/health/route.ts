import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/services/admin/health-check";

/**
 * Public health endpoint for external monitoring (e.g. uptime checks).
 * Returns 200 when the database is reachable, 503 when it is down.
 * No authentication required.
 */
export async function GET() {
    try {
        const dbResult = await checkDatabase();
        const ok = dbResult.status === "healthy" || dbResult.status === "degraded";

        if (!ok) {
            return NextResponse.json(
                {
                    status: "unhealthy",
                    database: dbResult.status,
                    message: dbResult.message,
                },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: "ok",
            database: dbResult.status,
            latencyMs: dbResult.latencyMs,
        });
    } catch {
        return NextResponse.json(
            { status: "unhealthy", message: "Health check failed" },
            { status: 503 }
        );
    }
}
