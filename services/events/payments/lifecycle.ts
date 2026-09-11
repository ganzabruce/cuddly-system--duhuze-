import { eq, sql } from "drizzle-orm";
import db from "@/lib/db";
import { withTransaction } from "@/lib/db/serverless";
import {
  eventPayments,
  events,
  guests,
} from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import {
  sendRsvpConfirmationSideEffects,
} from "@/lib/services/events/rsvp-side-effects";
import type { EventPaymentRow, FinalizeSuccessInput, FinalizeFailureInput, RsvpContext } from "./types";

async function sendEventPaymentConfirmationSideEffects(paymentId: number) {
  const [row] = await db
    .select({
      paymentId: eventPayments.id,
      amount: eventPayments.amount,
      currency: eventPayments.currency,
      rsvpContext: eventPayments.rsvpContext,
      guestId: guests.id,
      guestName: guests.name,
      guestEmail: guests.email,
      guestToken: guests.guestToken,
      eventId: events.id,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventDate: events.date,
      eventTimezone: events.timezone,
      locationType: events.locationType,
      locationName: events.locationName,
      locationLink: events.locationLink,
      organizerId: events.createdBy,
      organizerUsername: events.username,
    })
    .from(eventPayments)
    .innerJoin(guests, eq(guests.id, eventPayments.guestId))
    .innerJoin(events, eq(events.id, eventPayments.eventId))
    .where(eq(eventPayments.id, paymentId))
    .limit(1);

  if (!row) {
    return;
  }

  const ctx = row.rsvpContext as RsvpContext | null;

  if (!row.guestEmail) return;

  await sendRsvpConfirmationSideEffects({
    to: row.guestEmail,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestToken: row.guestToken,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventSlug: row.eventSlug,
    eventDate: row.eventDate,
    eventTimezone: row.eventTimezone,
    eventUsername: row.organizerUsername,
    organizerId: row.organizerId,
    rsvpStatus: "yes",
    rsvpNote: ctx?.rsvpNote ?? null,
    additionalGuestCount: ctx?.additionalGuestCount ?? 0,
    additionalGuests: ctx?.additionalGuests ?? [],
    customQuestionResponses: ctx?.customQuestionResponses ?? [],
    notificationType: "rsvp_received",
    locationName: row.locationName,
    locationLink: row.locationLink,
    locationType: row.locationType,
    contributionRequired: true,
    contributionAmount: ctx?.contributionAmount ?? row.amount,
    contributionPaymentInfo: null,
    currency: ctx?.currency ?? row.currency,
  });
}

export async function confirmEventPaymentSuccess(
  input: FinalizeSuccessInput,
): Promise<EventPaymentRow> {
  const now = input.paidAt ?? new Date();
  const result = await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(eventPayments)
      .where(eq(eventPayments.id, input.paymentId))
      .limit(1);

    if (!payment) {
      throw new ValidationError("Event payment not found.");
    }

    if (payment.status === "succeeded") {
      return { payment, becameConfirmed: false };
    }

    if (payment.status !== "pending") {
      return { payment, becameConfirmed: false };
    }

    const [updatedPayment] = await tx
      .update(eventPayments)
      .set({
        status: "succeeded",
        providerTransactionId:
          input.providerTransactionId ?? payment.providerTransactionId ?? null,
        providerReferenceNo:
          input.providerReferenceNo ?? payment.providerReferenceNo ?? null,
        providerStatusCode: input.providerStatusCode ?? payment.providerStatusCode ?? null,
        rawProviderStatus: input.rawProviderStatus ?? payment.rawProviderStatus ?? null,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(eventPayments.id, input.paymentId))
      .returning();

    await tx
      .update(guests)
      .set({
        rsvpStatus: "yes",
        respondedAt: now,
      })
      .where(eq(guests.id, payment.guestId));

    await tx
      .update(events)
      .set({
        totalCollected: sql`${events.totalCollected} + ${payment.amount}`,
        availableBalance: sql`${events.availableBalance} + ${payment.amount}`,
      })
      .where(eq(events.id, payment.eventId));

    return { payment: updatedPayment ?? payment, becameConfirmed: true };
  });

  if (result.becameConfirmed) {
    await sendEventPaymentConfirmationSideEffects(result.payment.id);
  }

  return result.payment;
}

export async function finalizeEventPaymentFailure(
  input: FinalizeFailureInput,
): Promise<EventPaymentRow> {
  const nextStatus = input.status ?? "failed";
  const now = new Date();
  const [payment] = await db
    .select()
    .from(eventPayments)
    .where(eq(eventPayments.id, input.paymentId))
    .limit(1);

  if (!payment) {
    throw new ValidationError("Event payment not found.");
  }

  if (payment.status !== "pending") {
    return payment;
  }

  const [updated] = await db
    .update(eventPayments)
    .set({
      status: nextStatus,
      providerTransactionId:
        input.providerTransactionId ?? payment.providerTransactionId ?? null,
      providerReferenceNo:
        input.providerReferenceNo ?? payment.providerReferenceNo ?? null,
      providerStatusCode: input.providerStatusCode ?? payment.providerStatusCode ?? null,
      rawProviderStatus: input.rawProviderStatus ?? payment.rawProviderStatus ?? null,
      updatedAt: now,
    })
    .where(eq(eventPayments.id, input.paymentId))
    .returning();

  return updated ?? payment;
}
