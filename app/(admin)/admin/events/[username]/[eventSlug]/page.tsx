import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDetailSection } from "@/components/admin/events/EventDetailSection";
import { EventActionsSection } from "@/components/admin/events/EventActionsSection";
import { EventDetailSkeleton } from "@/components/skeletons/EventDetailSkeleton";
import { getEventDetailAction } from "@/actions/admin/events";

export default async function AdminEventDetailRoute({
    params,
}: {
    params: Promise<{ username: string; eventSlug: string }>;
}) {
    const { username, eventSlug } = await params;
    const dataPromise = getEventDetailAction({ username, slug: eventSlug });

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                        Event Details
                    </h1>
                    <Suspense fallback={<Skeleton className="h-9 w-24" />}>
                        <EventActionsSection dataPromise={dataPromise} />
                    </Suspense>
                </div>
            </div>

            <div className="space-y-6">
                <Suspense fallback={<EventDetailSkeleton />}>
                    <EventDetailSection dataPromise={dataPromise} />
                </Suspense>
            </div>
        </div>
    );
}
