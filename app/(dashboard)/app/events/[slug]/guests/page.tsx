import { Suspense } from "react";
import { DashboardEventGuestsPage } from "@/components/events/DashboardEventGuestsPage";
import { DashboardEventGuestsSkeleton } from "@/components/skeletons/DashboardEventGuestsSkeleton";
import { getDashboardEventGuests } from "@/actions/events/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest List | Duhuze RSVP",
};

export default async function EventGuestsRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<DashboardEventGuestsSkeleton />}>
      <DashboardEventGuestsPage dataPromise={getDashboardEventGuests(slug)} />
    </Suspense>
  );
}
