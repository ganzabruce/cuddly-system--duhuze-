"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth/auth";
import {
    bulkCreateGuests,
    bulkDeleteGuests,
} from "@/lib/services/guests/bulk-operations";
import { getGuestById, getUserGuests } from "@/lib/services/guests/get-guests";
import { updateGuest as updateGuestService } from "@/lib/services/guests/update-guest";
import { deleteGuest as deleteGuestService } from "@/lib/services/guests/delete-guest";
import { resolveInviteToken } from "@/actions/guests/resolve-invite-token";
import { getUserEvents } from "@/actions/events/get-events";
import { getUserSettings } from "@/lib/services/auth/user-settings";
import { sendInvitations } from "@/lib/services/events/invitation-service";
import { sendReminders } from "@/lib/services/events/reminder-service";
import { AppError } from "@/lib/utils/errors";
import { z } from "zod";
import logger from "@/lib/utils/logger";

function handleError(error: unknown): string {
    if (error instanceof z.ZodError) {
        return error.issues[0]?.message ?? "Validation failed";
    }
    if (error instanceof AppError) {
        return error.message;
    }
    logger.error("Unexpected error in guest action", error);
    return "Something went wrong";
}

export async function addGuests(data: {
    eventId: number;
    source?: "manual" | "csv_import";
    guests: Array<{
        name: string;
        email?: string | null;
        phoneNumber?: string | null;
        rsvpStatus?: "yes" | "no" | "maybe" | null;
    }>;
}) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const result = await bulkCreateGuests(data, user.id);
        revalidatePath("/app", "layout");
        return { data: result };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function deleteGuestsBulk(guestIds: number[]) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const result = await bulkDeleteGuests(guestIds, user.id);
        revalidatePath("/app", "layout");
        return { data: result };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function updateGuestAction(
    guestId: number,
    data: Record<string, unknown>,
) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const updated = await updateGuestService(guestId, data, user.id);
        return { data: updated };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function deleteGuestAction(guestId: number) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const result = await deleteGuestService(guestId, user.id);
        revalidatePath("/app", "layout");
        return { data: result };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function getDashboardAllGuests() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [eventsResult, guestsResult, userSettings] = await Promise.all([
        getUserEvents(user.id, { limit: 500 }),
        getUserGuests(user.id, { limit: 500 }),
        getUserSettings(user.id),
    ]);

    const userEvents = eventsResult.data.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        date: e.date.toISOString(),
    }));

    const allGuests = guestsResult.data.map((guest) => ({
        ...guest,
        rsvpStatus: guest.rsvpStatus as "yes" | "no" | "maybe" | null,
        respondedAt: guest.respondedAt ? guest.respondedAt.toISOString() : null,
        createdAt: guest.createdAt ? guest.createdAt.toISOString() : null,
        eventDate: guest.eventDate.toISOString(),
    }));

    return {
        guests: allGuests,
        events: userEvents,
        hour12: userSettings?.preferences.dateFormat !== "24h",
    };
}

export async function getGuestDetail(guestId: number) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const guest = await getGuestById(guestId, user.id);
        return { data: guest };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function sendInvitationsAction(
    eventId: number,
    guestIds?: number[],
) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const result = await sendInvitations(
            { eventId, guestIds },
            user.id,
        );

        const configError =
            result.failedCount > 0 &&
            result.errors?.some(
                (e) =>
                    typeof e.error === "string" &&
                    e.error.includes("RESEND_API_KEY is not configured"),
            );

        if (configError) {
            return {
                data: result,
                configError: true,
                message:
                    "Email is not configured. Set RESEND_API_KEY to send emails.",
            };
        }

        return { data: result };
    } catch (error) {
        return { error: handleError(error) };
    }
}

export async function sendRemindersAction(
    eventId: number,
    guestIds?: number[],
) {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const result = await sendReminders(
            { eventId, guestIds },
            user.id,
        );

        const configError =
            result.failedCount > 0 &&
            result.errors?.some(
                (e) =>
                    typeof e.error === "string" &&
                    e.error.includes("RESEND_API_KEY is not configured"),
            );

        if (configError) {
            return {
                data: result,
                configError: true,
                message:
                    "Email is not configured. Set RESEND_API_KEY to send emails.",
            };
        }

        return { data: result };
    } catch (error) {
        return { error: handleError(error) };
    }
}

// PUBLIC ACTION — no auth by design (guest-facing invite link resolution)
export async function resolveInviteTokenAction(params: {
    username: string;
    eventSlug: string;
    token: string;
}) {
    return resolveInviteToken(params);
}
