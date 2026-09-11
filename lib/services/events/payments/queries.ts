import { and, eq } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { eventPayments } from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import { parseRwandanMobile } from "@/lib/utils/phone";
import type { EventPaymentRow, CreatePendingEventPaymentAttemptInput } from "./types";
import { assertEventPaymentCanStart, buildRequestTransactionId } from "./helpers";

export async function getEventPaymentByRequestTransactionId(
  requestTransactionId: string,
  executor: DbExecutor = db,
): Promise<EventPaymentRow | null> {
  const [row] = await executor
    .select()
    .from(eventPayments)
    .where(eq(eventPayments.requestTransactionId, requestTransactionId))
    .limit(1);

  return row ?? null;
}

export async function updateEventPaymentProviderDetails(
  paymentId: number,
  details: {
    providerTransactionId?: string | null;
    providerReferenceNo?: string | null;
    providerStatusCode?: string | null;
    rawProviderStatus?: unknown;
  },
  executor: DbExecutor = db,
) {
  const [updated] = await executor
    .update(eventPayments)
    .set({
      providerTransactionId: details.providerTransactionId ?? null,
      providerReferenceNo: details.providerReferenceNo ?? null,
      providerStatusCode: details.providerStatusCode ?? null,
      rawProviderStatus: details.rawProviderStatus ?? null,
      updatedAt: new Date(),
    })
    .where(eq(eventPayments.id, paymentId))
    .returning();

  if (!updated) {
    throw new ValidationError("Failed to update event payment details.");
  }

  return updated;
}

export async function createPendingEventPaymentAttempt(
  input: CreatePendingEventPaymentAttemptInput,
): Promise<EventPaymentRow> {
  const payerPhone = input.payerPhone
    ? parseRwandanMobile(input.payerPhone)
    : null;
  const executor = input.executor ?? db;
  const requestTransactionId = buildRequestTransactionId(input.eventId, input.guestId);
  const expiresAt = input.expiresAt ?? null;

  await assertEventPaymentCanStart(input.organizerId, input.amount, executor);

  const pendingRows = await executor
    .select({ id: eventPayments.id })
    .from(eventPayments)
    .where(
      and(
        eq(eventPayments.eventId, input.eventId),
        eq(eventPayments.guestId, input.guestId),
        eq(eventPayments.status, "pending"),
      ),
    );

  if (pendingRows.length > 0) {
    await executor
      .update(eventPayments)
      .set({
        status: "failed",
        providerStatusCode: "RETRY_REPLACED",
        rawProviderStatus: { reason: "retry_replaced" },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventPayments.eventId, input.eventId),
          eq(eventPayments.guestId, input.guestId),
          eq(eventPayments.status, "pending"),
        ),
      );
  }

  const [created] = await executor
    .insert(eventPayments)
    .values({
      eventId: input.eventId,
      guestId: input.guestId,
      organizerId: input.organizerId,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      providerName: input.providerName,
      requestTransactionId,
      payerPhone,
      payerName: input.payerName,
      rsvpContext: input.rsvpContext ?? null,
      expiresAt,
    })
    .returning();

  if (!created) {
    throw new ValidationError("Failed to create event payment.");
  }

  return created;
}
