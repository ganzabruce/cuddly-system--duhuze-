import { Suspense } from "react";
import { AnnouncementsSection } from "@/components/admin/announcements/AnnouncementsSection";
import { AnnouncementsSkeleton } from "@/components/skeletons/AnnouncementsSkeleton";
import { listAnnouncementsAction } from "@/actions/admin/announcements";

export default function AdminAnnouncementsRoute() {
  const dataPromise = listAnnouncementsAction();

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the site-wide banner. Only one announcement can be active at a time.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="p-4 md:p-5">
          <Suspense fallback={<AnnouncementsSkeleton />}>
            <AnnouncementsSection dataPromise={dataPromise} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
