"use client";

import { use } from "react";
import type { getEventDetailAction } from "@/actions/admin/events";
import { EventActionsServer } from "@/components/admin/events/EventActionsServer";

export function EventActionsSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getEventDetailAction>;
}) {
    const event = use(dataPromise);

    return <EventActionsServer event={event} />;
}
