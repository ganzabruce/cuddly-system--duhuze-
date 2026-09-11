import { Suspense } from "react";
import { HealthPage } from "@/components/admin/health/HealthPage";
import { HealthSkeleton } from "@/components/skeletons/HealthSkeleton";

export default function AdminHealthRoute() {
  return (
    <Suspense fallback={<HealthSkeleton />}>
      <HealthPage />
    </Suspense>
  );
}
