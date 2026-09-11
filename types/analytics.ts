export type PresetRange =
    | "all_time"
    | "last_7_days"
    | "last_30_days"
    | "last_90_days"
    | "custom";

export interface AnalyticsDateRange {
    preset: PresetRange;
    startDate: Date | null;
    endDate: Date | null;
}

export type EventAnalyticsRow = {
    eventId: number;
    title: string;
    slug: string;
    date: Date | string;
    totalGuests: number;
    yesCount: number;
    noCount: number;
    maybeCount: number;
    pendingCount: number;
    responseRate: number;
    guestCapacity: number | null;
    invitationsSent: number;
    invitationsOpened: number;
    openRate: number; // 0-100, of those sent
};

export type AnalyticsData = {
    totalEvents: number;
    totalGuests: number;
    totalResponded: number;
    overallResponseRate: number;
    totalInvitationsSent: number;
    totalInvitationsOpened: number;
    overallOpenRate: number; // of those sent
    avgTimeToRespondDays: number | null; // null if no data
    events: EventAnalyticsRow[];
};
