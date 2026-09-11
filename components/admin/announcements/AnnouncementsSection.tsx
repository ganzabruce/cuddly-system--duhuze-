"use client";

import { use } from "react";
import type { listAnnouncementsAction } from "@/actions/admin/announcements";
import { AnnouncementsClient } from "@/components/admin/announcements/AnnouncementsClient";

export function AnnouncementsSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof listAnnouncementsAction>;
}) {
  const announcements = use(dataPromise);

  return <AnnouncementsClient initialAnnouncements={announcements} />;
}
