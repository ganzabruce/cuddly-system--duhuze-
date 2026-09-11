"use server";

import { requireAdmin } from "@/actions/admin/auth";
import {
  runHealthChecks,
  getOverallStatus,
  serializeHealthResult,
} from "@/lib/services/admin/health-check";

export async function getHealthDataAction() {
  await requireAdmin();
  const result = await runHealthChecks();

  return {
    result: serializeHealthResult(result),
    overall: getOverallStatus(result),
  };
}

export type HealthPageData = Awaited<ReturnType<typeof getHealthDataAction>>;
