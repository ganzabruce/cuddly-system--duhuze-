import { Suspense } from "react";
import { getDashboardEventTitle, getDashboardEventDetail } from "@/actions/events/dashboard";
import { DashboardEventDetailPage } from "@/components/events/DashboardEventDetailPage";
import { DashboardEventDetailSkeleton } from "@/components/skeletons/DashboardEventDetailSkeleton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = await getDashboardEventTitle(slug);
  return { title: title ? `${title} | Duhuze RSVP` : "Event | Duhuze RSVP" };
}

export default async function DashboardEventDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<DashboardEventDetailSkeleton />}>
      <DashboardEventDetailPage dataPromise={getDashboardEventDetail(slug)} />
    </Suspense>
  );
}
