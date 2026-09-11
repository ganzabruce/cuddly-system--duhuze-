import { Suspense } from "react";
import { getEventListAction } from "@/actions/admin/events";
import { EventsSection } from "@/components/admin/events/EventsSection";
import { EventsListSkeleton } from "@/components/skeletons/EventsListSkeleton";

type SearchParams = {
    page?: string;
    search?: string;
    visibility?: "public" | "private";
    filter?: "upcoming" | "past";
};

export default async function AdminEventsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? "1", 10);
    const search = params.search ?? "";
    const visibility = params.visibility;
    const filter = params.filter;

    const resultPromise = getEventListAction({
        page,
        limit: 20,
        search: search || undefined,
        visibility,
        filter,
    });

    return (
        <div className="w-full min-w-0">
            {/* Page header */}
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                        Event Management
                    </h1>
                </div>
            </div>

            {/* Events list */}
            <div className="rounded-md border border-border bg-card">
                <div className="p-4 md:p-5">
                    <Suspense fallback={<EventsListSkeleton />}>
                        <EventsSection
                            resultPromise={resultPromise}
                            search={search}
                            visibility={visibility}
                            filter={filter}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
