import { Suspense } from "react";
import { AdminsSection, AdminsDescription } from "@/components/admin/admins/AdminsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminsPageDataAction } from "@/actions/admin/admins";

export default function AdminAdminsRoute() {
  const dataPromise = getAdminsPageDataAction();

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-foreground">Admin Management</h1>
          <Suspense fallback={<Skeleton className="mt-1 h-4 w-72" />}>
            <AdminsDescription dataPromise={dataPromise} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <AdminsSection dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
