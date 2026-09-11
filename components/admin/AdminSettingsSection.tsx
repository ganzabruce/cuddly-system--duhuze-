"use client";

import { use } from "react";
import type { getAdminProfileAction } from "@/actions/admin/settings";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export function AdminSettingsSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getAdminProfileAction>;
}) {
  const { adminEmail, adminName } = use(dataPromise);

  return <AdminSettingsClient adminEmail={adminEmail} adminName={adminName} />;
}
