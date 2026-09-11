"use server";

import { z } from "zod";
import { resolveError, deleteErrorsOlderThan, getErrorLog } from "@/actions/admin/error-log";
import type { ErrorLogParams } from "@/types/admin";
import {
    runHealthChecks,
    getOverallStatus,
    serializeHealthResult,
} from "@/lib/services/admin/health-check";
import { requireAdmin } from "@/actions/admin/auth";

const idSchema = z.number().int().positive();
const olderThanDaysSchema = z.number().int().positive();

export async function getErrorsPageDataAction(params: ErrorLogParams) {
    await requireAdmin();
    const [logResult, healthResult] = await Promise.all([
        getErrorLog(params),
        runHealthChecks(),
    ]);

    return {
        logResult,
        healthResult: serializeHealthResult(healthResult),
        overallHealth: getOverallStatus(healthResult),
    };
}

export async function resolveErrorAction(
    id: number
): Promise<{ success: boolean; error?: string }> {
    const admin = await requireAdmin();

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
        return { success: false, error: "Invalid error id" };
    }

    return resolveError(parsedId.data, admin.email);
}

export async function deleteOldErrorsAction(
    olderThanDays: number
): Promise<{ success: boolean; deleted?: number; error?: string }> {
    await requireAdmin();

    const parsedDays = olderThanDaysSchema.safeParse(olderThanDays);
    if (!parsedDays.success) {
        return { success: false, error: "olderThanDays must be a positive integer" };
    }

    const before = new Date();
    before.setDate(before.getDate() - parsedDays.data);
    const { deleted } = await deleteErrorsOlderThan(before);
    return { success: true, deleted };
}
