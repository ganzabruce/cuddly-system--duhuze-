"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { getDashboardEventGuests } from "@/actions/events/dashboard";
import { GuestInsights } from "@/components/events/GuestInsights";
import { GuestManager } from "@/components/events/GuestManager";

export function DashboardEventGuestsPage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardEventGuests>;
}) {
    const data = use(dataPromise);
    const { event, eventGuests, guestStats, responseRate, total, hour12, publicUrl, featureAccess } = data;

    return (
        <div className="w-full min-w-0 pt-4 md:pt-0">
            <div className="space-y-6">
                <Link
                    href={`/app/events/${event.slug}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to event
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {event.title} — Guest List
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {total} {total === 1 ? "guest" : "guests"} total
                    </p>
                </div>

                {total > 0 && (
                    <GuestInsights guestStats={guestStats} responseRate={responseRate} />
                )}

                <GuestManager
                    eventGuests={eventGuests}
                    eventName={event.title}
                    eventId={event.id}
                    eventSlug={event.slug}
                    eventPublicUrl={publicUrl}
                    hour12={hour12}
                    featureAccess={featureAccess}
                />
            </div>
        </div>
    );
}
