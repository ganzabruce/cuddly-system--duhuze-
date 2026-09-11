"use client";

import type { GuestStats } from "@/types/guests";
import { StatCard, type StatCardVariant } from "@/components/layout/StatCard";

type GuestStatCardEntry = {
    label: string;
    value: number;
    variant: StatCardVariant;
};

export type GuestStatsCardsBaseProps = {
    stats: GuestStats;
    /** When true (e.g. dashboard), show Total, Events, Attending, Pending. When false (event scope), show Total, Attending, Maybe, Pending. */
    showEventsCard?: boolean;
};

export function GuestStatsCardsBase({
    stats,
    showEventsCard = false,
}: GuestStatsCardsBaseProps) {
    const cards: GuestStatCardEntry[] = [
        { label: "Total Guests", value: stats.total, variant: "default" },
        { label: "Attending", value: stats.yes, variant: "success" },
        { label: "Maybe", value: stats.maybe, variant: "warning" },
        { label: "Declined", value: stats.no, variant: "destructive" },
    ];

    if (showEventsCard) {
        cards.splice(1, 0, {
            label: "Events",
            value: stats.totalEvents ?? 0,
            variant: "default",
        });
        cards.splice(3, 1);
    }

    return (
        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {cards.map((card) => (
                <StatCard
                    key={card.label}
                    title={card.label}
                    value={card.value}
                    variant={card.variant}
                />
            ))}
        </div>
    );
}
