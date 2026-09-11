"use client";

import { use } from "react";
import type { getEventListAction } from "@/actions/admin/events";
import { EventsClient } from "./EventsClient";

type EventsSectionProps = {
    resultPromise: ReturnType<typeof getEventListAction>;
    search: string;
    visibility: "public" | "private" | undefined;
    filter: "upcoming" | "past" | undefined;
};

export function EventsSection({ resultPromise, search, visibility, filter }: EventsSectionProps) {
    const result = use(resultPromise);

    return (
        <EventsClient
            initialEvents={result.events}
            initialTotal={result.total}
            initialPage={result.page}
            initialSearch={search}
            initialVisibility={visibility ?? "all"}
            initialDateFilter={filter ?? "all"}
        />
    );
}
