"use server";

import { requireAdmin } from "@/actions/admin/auth";
import { updateAdminName } from "@/actions/admin/settings-queries";

export async function getAdminProfileAction() {
  const admin = await requireAdmin();
  return { adminEmail: admin.email, adminName: admin.name };
}

export async function updateAdminProfileAction(payload: { name: string }) {
  return updateAdminName(payload.name);
}
