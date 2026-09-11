"use client";

import { EventActions } from "./EventActions";
import {
    toggleEventVisibilityAction,
    deleteEventAction,
} from "@/actions/admin/events";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EventWithStats } from "@/types/admin";

type EventActionsServerProps = {
    event: EventWithStats;
};

export function EventActionsServer({
    event,
}: EventActionsServerProps) {
    const router = useRouter();
    const [isToggling, setIsToggling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleToggleVisibility() {
        setIsToggling(true);
        try {
            await toggleEventVisibilityAction({ username: event.username, slug: event.slug });
            router.refresh();
        } finally {
            setIsToggling(false);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            await deleteEventAction({ username: event.username, slug: event.slug });
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <EventActions
            event={event}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDelete}
            isToggling={isToggling}
            isDeleting={isDeleting}
        />
    );
}
