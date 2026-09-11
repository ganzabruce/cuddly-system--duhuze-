import { and, eq, gte, lte } from "drizzle-orm";
import db from "@/lib/db";
import { events } from "@/lib/db/schema";
import { sendScheduledReminders } from "@/lib/services/events/reminder-service";
import { inngest } from "../client";

const HOUR_MS = 60 * 60 * 1000;
const WINDOW_START_HOURS = 23;
const WINDOW_END_HOURS = 25;

export const scheduledRemindersCron = inngest.createFunction(
    {
        id: "scheduled-reminders-cron",
        name: "24h before event: find events and fan-out",
        retries: 2,
    },
    { cron: "0 * * * *" },
    async ({ step }) => {
        const now = new Date();
        const windowStart = new Date(
            now.getTime() + WINDOW_START_HOURS * HOUR_MS,
        );
        const windowEnd = new Date(now.getTime() + WINDOW_END_HOURS * HOUR_MS);

        const eventsInWindow = await step.run("query-events-in-window", async () => {
            const rows = await db
                .select({ id: events.id })
                .from(events)
                .where(
                    and(
                        gte(events.date, windowStart),
                        lte(events.date, windowEnd),
                        eq(events.status, "published"),
                    ),
                );
            return rows.map((r) => r.id);
        });

        if (eventsInWindow.length === 0) {
            return { eventIds: [], sent: 0 };
        }

        await step.sendEvent(
            "fan-out-send-reminders",
            eventsInWindow.map((eventId) => ({
                name: "event/reminder.send",
                data: { eventId },
            })),
        );

        return { eventIds: eventsInWindow, sent: eventsInWindow.length };
    },
);

export const sendEventReminder = inngest.createFunction(
    {
        id: "send-event-reminder",
        name: "Send 24h-before reminders for one event",
        retries: 3,
        concurrency: 10,
    },
    { event: "event/reminder.send" },
    async ({ event, step }) => {
        const { eventId } = event.data as { eventId: number };

        const result = await step.run("send-scheduled-reminders", async () => {
            return await sendScheduledReminders(eventId);
        });

        return result;
    },
);
