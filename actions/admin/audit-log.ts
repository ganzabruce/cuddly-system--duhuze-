"use server";

import { requireAdmin } from "@/actions/admin/auth";
import { getAuditLog } from "@/lib/services/admin/audit-log";
import type { AuditLogParams } from "@/types/admin";

export async function getAuditLogAction(params: AuditLogParams) {
    await requireAdmin();
    return getAuditLog(params);
}
