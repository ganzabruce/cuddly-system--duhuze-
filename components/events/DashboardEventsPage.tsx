"use client";

import { use } from "react";
import type { getDashboardEvents } from "@/actions/events/dashboard";
import type { ViewMode } from "@/components/events/ViewToggle";
import EventsListClient from "@/components/events/EventsListClient";

export function DashboardEventsPage({
    view,
    eventsPromise,
}: {
    view?: string;
    eventsPromise: ReturnType<typeof getDashboardEvents>;
}) {
    const userEvents = use(eventsPromise);
    const currentView: ViewMode = view === "grid" ? "grid" : "list";

    return <EventsListClient events={userEvents} view={currentView} />;
}
