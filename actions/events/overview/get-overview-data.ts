"use server";

import db from "@/lib/db";
import { getUserById } from "@/lib/services/auth/user-service";
import { events } from "@/lib/db/schema";
import { eq, sql, and, gte, asc } from "drizzle-orm";
import { fetchRecentActivities } from "@/lib/services/events/activities";
import { getAnalyticsData } from "../analytics/get-analytics-data";
import logger from "@/lib/utils/logger";
import type { OverviewData, UpcomingEvent } from "@/types/events";

export async function getOverviewData(
    userId: number,
): Promise<OverviewData | null> {
    const now = new Date();

    let user;
    try {
        user = await getUserById(userId);
    } catch (e) {
        logger.error("Failed to load user for overview", e);
        return null;
    }
    if (!user) return null;
    const username = user.username!;
    const displayName = user.name?.split(" ")?.[0] ?? username;
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const isNewUser = user.createdAt
        ? new Date().getTime() - new Date(user.createdAt).getTime() < DAY_IN_MS
        : false;

    const [upcomingCountRes, upcomingEventsListRes, activitiesResult, analyticsData] =
        await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(events)
                .where(
                    and(
                        eq(events.createdBy, user.id),
                        gte(events.date, now),
                    ),
                )
                .then((r) => r[0]?.count ?? 0)
                .catch((e) => {
                    logger.warn("Overview: upcoming count failed", e);
                    return 0;
                }),
            db
                .select({
                    id: events.id,
                    title: events.title,
                    date: events.date,
                    slug: events.slug,
                })
                .from(events)
                .where(
                    and(
                        eq(events.createdBy, user.id),
                        gte(events.date, now),
                    ),
                )
                .orderBy(asc(events.date))
                .limit(5)
                .catch((e) => {
                    logger.warn("Overview: upcoming events list failed", e);
                    return [] as UpcomingEvent[];
                }),
            fetchRecentActivities(user.id).catch((e) => {
                logger.warn("Overview: recent activities failed", e);
                return [] as OverviewData["activities"];
            }),
            getAnalyticsData(user.id).catch((e) => {
                logger.warn("Overview: analytics data failed", e);
                return null;
            }),
        ]);

    return {
        displayName,
        isNewUser,
        upcomingCount: typeof upcomingCountRes === "number" ? upcomingCountRes : 0,
        upcomingEvents: Array.isArray(upcomingEventsListRes) ? upcomingEventsListRes : [],
        activities: Array.isArray(activitiesResult) ? activitiesResult : [],
        allEvents: analyticsData?.events ?? [],
    };
}
