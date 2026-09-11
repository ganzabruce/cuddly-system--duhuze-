"use server";

import { requireAdmin } from "@/actions/admin/auth";
import { getPlatformStats } from "@/lib/services/admin/platform-stats";
import {
  runHealthChecks,
  getOverallStatus,
  serializeHealthResult,
} from "@/lib/services/admin/health-check";

export async function getOverviewData() {
  await requireAdmin();

  const [stats, healthResult] = await Promise.all([
    getPlatformStats(),
    runHealthChecks(),
  ]);

  const overallHealth = getOverallStatus(healthResult);

  return {
    stats: {
      ...stats,
      recentSignups: stats.recentSignups.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      recentEvents: stats.recentEvents.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    },
    healthResult: serializeHealthResult(healthResult),
    overallHealth,
  };
}

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;
