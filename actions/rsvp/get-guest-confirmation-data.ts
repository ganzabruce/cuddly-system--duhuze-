"use server";

import { desc, eq } from "drizzle-orm";
import db from "@/lib/db";
import { eventPayments, eventSettings, rsvpAdditionalGuests, users } from "@/lib/db/schema";
import { resolveGuestByToken } from "@/actions/guests/resolve-by-token";
import type { GuestWithEvent } from "@/types/guests";
import { parseUserPreferences } from "@/types/auth";
import {
  getEventCapacityInfo,
} from "@/actions/events/get-event-capacity";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";
import { normalizeCustomQuestionResponses } from "@/lib/constants/events/rsvp-config";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";

export type GuestConfirmationResult =
  | { status: "invalid" }
  | { status: "unavailable"; eventTitle: string }
  | ({ status: "ok" } & Awaited<ReturnType<typeof buildGuestConfirmationData>>);

// PUBLIC ACTION — no auth by design (token-scoped via resolveGuestByToken)
export async function getGuestConfirmationData(
  token: string,
  routeContext: { username: string; eventSlug: string },
): Promise<GuestConfirmationResult> {
  const resolved = await resolveGuestByToken(token, routeContext);
  if (!resolved) return { status: "invalid" };

  const { guest, event } = resolved;
  const eventStatus = (event.status ?? "published") as
    | "published"
    | "completed"
    | "draft"
    | "cancelled";

  if (eventStatus === "draft" || eventStatus === "cancelled") {
    return { status: "unavailable", eventTitle: event.title };
  }

  const data = await buildGuestConfirmationData(token, guest, event, eventStatus);
  return { status: "ok", ...data };
}

async function buildGuestConfirmationData(
  token: string,
  guest: GuestWithEvent["guest"],
  event: GuestWithEvent["event"],
  eventStatus: "published" | "completed" | "draft" | "cancelled",
) {
  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  const [settingsRows, additionalGuestsRows, organizerRows, capacityInfo] = await Promise.all([
    db
      .select({
        guestCapacity: eventSettings.guestCapacity,
        allowAdditionalGuests: eventSettings.allowAdditionalGuests,
        customQuestions: eventSettings.customQuestions,
        attendeeCategories: eventSettings.attendeeCategories,
        contributionPaymentInfo: eventSettings.contributionPaymentInfo,
        contributionAmount: eventSettings.contributionAmount,
        contributionCollectionMode: eventSettings.contributionCollectionMode,
        currency: eventSettings.currency,
        maxAdditionalGuests: eventSettings.maxAdditionalGuests,
      })
      .from(eventSettings)
      .where(eq(eventSettings.eventId, event.id))
      .limit(1),
    db
      .select({
        id: rsvpAdditionalGuests.id,
        name: rsvpAdditionalGuests.name,
        email: rsvpAdditionalGuests.email,
        categoryId: rsvpAdditionalGuests.categoryId,
        categoryLabel: rsvpAdditionalGuests.categoryLabel,
        sortOrder: rsvpAdditionalGuests.sortOrder,
      })
      .from(rsvpAdditionalGuests)
      .where(eq(rsvpAdditionalGuests.guestId, guest.id)),
    db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, event.createdBy))
      .limit(1),
    getEventCapacityInfo(event.id),
  ]);

  const [pendingPaymentRow] = await db
    .select({
      id: eventPayments.id,
      providerName: eventPayments.providerName,
      requestTransactionId: eventPayments.requestTransactionId,
      amount: eventPayments.amount,
      currency: eventPayments.currency,
      status: eventPayments.status,
      payerPhone: eventPayments.payerPhone,
    })
    .from(eventPayments)
    .where(eq(eventPayments.guestId, guest.id))
    .orderBy(desc(eventPayments.createdAt))
    .limit(1);

  const organizerPreferences = parseUserPreferences(organizerRows[0]?.preferences ?? null);
  const useHour12 = organizerPreferences.dateFormat !== "24h";
  const settings = settingsRows[0];
  const normalizedRouteToken = normalizeOpaqueToken(token);
  const effectiveToken = guest.guestToken ?? guest.confirmationToken ?? normalizedRouteToken;

  return {
    guest: {
      ...guest,
      customQuestionResponses: normalizeCustomQuestionResponses(
        guest.customQuestionResponses,
      ),
    },
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      image: event.image,
      imageFormat: event.imageFormat ?? "square",
      date: eventDate,
      endDate,
      locationName: event.locationName,
      locationLink: event.locationLink,
      username: event.username,
      slug: event.slug,
      status: eventStatus,
      timezone: event.timezone,
    },
    settings: {
      guestCapacity: settings?.guestCapacity ?? null,
      allowAdditionalGuests:
        (settings?.allowAdditionalGuests ?? false) ||
        ((settings?.attendeeCategories as unknown[] | null)?.length ?? 0) > 0,
      maxAdditionalGuests:
        settings?.maxAdditionalGuests ??
        DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP,
      totalSeatsUsed: capacityInfo.totalSeatsUsed,
      atCapacity: capacityInfo.atCapacity,
      customQuestions: settings?.customQuestions ?? null,
      attendeeCategories: settings?.attendeeCategories ?? null,
      contributionPaymentInfo: settings?.contributionPaymentInfo ?? null,
      contributionAmount: settings?.contributionAmount ?? null,
      currency: settings?.currency ?? "RWF",
      collectionMode: settings?.contributionCollectionMode ?? "offline",
    },
    additionalGuests: additionalGuestsRows,
    useHour12,
    token: effectiveToken,
    hasPaid: pendingPaymentRow?.status === "succeeded",
    pendingPayment:
      pendingPaymentRow && pendingPaymentRow.status === "pending"
        ? {
            id: pendingPaymentRow.id,
            requestTransactionId: pendingPaymentRow.requestTransactionId ?? "",
            amount: pendingPaymentRow.amount,
            currency: pendingPaymentRow.currency,
            status: pendingPaymentRow.status,
            paymentMethod: "mobile_money" as const,
            payerPhone: pendingPaymentRow.payerPhone ?? "",
          }
        : null,
  } as const;
}

// PUBLIC ACTION — no auth by design (token-scoped via resolveGuestByToken)
export async function getGuestConfirmationMetadata(
  token: string,
  routeContext: { username: string; eventSlug: string },
) {
  return resolveGuestByToken(token, routeContext);
}
