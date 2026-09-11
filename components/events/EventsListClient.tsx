"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { type EventCardProps } from "@/components/events/EventCard";
import { EventGrid } from "@/components/events/EventGrid";
import { EventList } from "@/components/events/EventList";
import type { ViewMode } from "./ViewToggle";

interface EventsListClientProps {
    events: EventCardProps[];
    view: ViewMode;
}

export default function EventsListClient({ events, view }: EventsListClientProps) {
    if (events.length === 0) {
        return (
            <div className="rounded-md border border-border bg-card px-5 py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No events yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Get started by creating your first event.
                    </p>
                    <Link href="/new" className="mt-2">
                        <Button size="sm">Create your first event</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return view === "grid" ? (
        <EventGrid events={events} />
    ) : (
        <EventList events={events} />
    );
}
