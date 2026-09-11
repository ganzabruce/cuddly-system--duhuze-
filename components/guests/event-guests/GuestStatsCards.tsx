"use client";

import type { GuestStats } from "@/types/guests";
import { GuestStatsCardsBase } from "@/components/guests/GuestStatsCardsBase";

type GuestStatsCardsProps = {
    stats: GuestStats;
};

export function GuestStatsCards({ stats }: GuestStatsCardsProps) {
    return <GuestStatsCardsBase stats={stats} />;
}
