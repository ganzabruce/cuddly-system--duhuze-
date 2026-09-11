"use client";

import { use } from "react";
import type { getEventDetailAction } from "@/actions/admin/events";
import { EventDetailCard } from "@/components/admin/events/EventDetailCard";

export function EventDetailSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getEventDetailAction>;
}) {
    const event = use(dataPromise);

    return <EventDetailCard event={event} />;
}
