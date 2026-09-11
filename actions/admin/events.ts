"use server";

import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/actions/admin/auth";
import {
    deleteEvent,
    toggleEventVisibility,
    getEventList,
    getEventBySlug,
} from "@/lib/services/admin/event-management";
import type { EventIdentifier, EventListParams } from "@/types/admin";

const eventIdentifierSchema = z.object({
    username: z.string().min(1),
    slug: z.string().min(1),
});

const eventListParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    visibility: z.enum(["public", "private"]).optional(),
    filter: z.enum(["upcoming", "past"]).optional(),
});

async function getAdminEmail(): Promise<string> {
    const admin = await requireAdmin();
    return admin.email;
}

export async function getEventListAction(params: EventListParams) {
    await requireAdmin();
    const validated = eventListParamsSchema.parse(params);
    return getEventList(validated);
}

export async function getEventDetailAction(identifier: EventIdentifier) {
    await requireAdmin();
    const validated = eventIdentifierSchema.parse(identifier);
    const event = await getEventBySlug(validated);
    if (!event) notFound();
    return event;
}

export async function toggleEventVisibilityAction(identifier: EventIdentifier): Promise<void> {
    const validated = eventIdentifierSchema.parse(identifier);
    const adminEmail = await getAdminEmail();
    const result = await toggleEventVisibility(validated, adminEmail);
    if (!result.success) {
        throw new Error(result.error ?? "Failed to toggle visibility");
    }

    redirect(`/admin/events/${validated.username}/${validated.slug}`);
}

export async function deleteEventAction(identifier: EventIdentifier): Promise<void> {
    const validated = eventIdentifierSchema.parse(identifier);
    const adminEmail = await getAdminEmail();
    const result = await deleteEvent(validated, adminEmail);
    if (!result.success) {
        throw new Error(result.error ?? "Failed to delete event");
    }

    redirect("/admin/events");
}
