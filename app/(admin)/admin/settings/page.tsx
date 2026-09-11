import { Suspense } from "react";
import { AdminSettingsSection } from "@/components/admin/AdminSettingsSection";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";
import { getAdminProfileAction } from "@/actions/admin/settings";

export default function AdminSettingsRoute() {
  const dataPromise = getAdminProfileAction();

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
              Admin Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your profile.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <AdminSettingsSection dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
