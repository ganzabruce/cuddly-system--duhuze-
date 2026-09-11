import { randomUUID } from "crypto";
import { and, desc, eq, lte, sql, type SQL } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { withTransaction } from "@/lib/db/serverless";
import { eventWithdrawals, events } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { ValidationError } from "@/lib/utils/errors";
import {
  assertIntouchConfig,
  getTransactionStatus,
  requestConfiguredDeposit,
} from "@/lib/services/billing/providers/intouch";
import { parseRwandanMobile } from "@/lib/utils/phone";

type EventWithdrawalRow = typeof eventWithdrawals.$inferSelect;

export type EventWithdrawalStatus = EventWithdrawalRow["status"];

export type CreateEventWithdrawalInput = {
  eventId: number;
  organizerId: number;
  amount: number;
  destinationPhone: string;
  reason?: string | null;
};

function assertIntouchConfigured() {
  assertIntouchConfig({
    baseUrl: env.INTOUCH_BASE_URL,
    username: env.INTOUCH_USERNAME,
    accountNo: env.INTOUCH_ACCOUNT_NO,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
  });
}

function buildRequestTransactionId(eventId: number, organizerId: number) {
  const random = randomUUID().replace(/-/g, "").slice(0, 12);
  return `withdraw-${eventId}-${organizerId}-${Date.now()}-${random}`;
}

async function getEventWithdrawalById(
  withdrawalId: number,
  executor: DbExecutor = db,
): Promise<EventWithdrawalRow | null> {
  const [row] = await executor
    .select()
    .from(eventWithdrawals)
    .where(eq(eventWithdrawals.id, withdrawalId))
    .limit(1);

  return row ?? null;
}

export async function getEventWithdrawalByRequestTransactionId(
  requestTransactionId: string,
  executor: DbExecutor = db,
): Promise<EventWithdrawalRow | null> {
  const [row] = await executor
    .select()
    .from(eventWithdrawals)
    .where(eq(eventWithdrawals.requestTransactionId, requestTransactionId))
    .limit(1);

  return row ?? null;
}

export async function listEventWithdrawals(
  eventId: number,
  organizerId: number,
  executor: DbExecutor = db,
): Promise<EventWithdrawalRow[]> {
  return executor
    .select()
    .from(eventWithdrawals)
    .where(
      and(
        eq(eventWithdrawals.eventId, eventId),
        eq(eventWithdrawals.organizerId, organizerId),
      ),
    )
    .orderBy(desc(eventWithdrawals.timestamp));
}

export async function createEventWithdrawal(
  input: CreateEventWithdrawalInput,
): Promise<EventWithdrawalRow> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new ValidationError("Withdrawal amount must be a positive whole number.");
  }

  assertIntouchConfigured();
  const destinationPhone = parseRwandanMobile(input.destinationPhone);
  if (!destinationPhone) {
    throw new ValidationError(
      "Enter a valid Rwandan MTN MoMo or Airtel Money number.",
    );
  }
  const now = new Date();
  const requestTransactionId = buildRequestTransactionId(
    input.eventId,
    input.organizerId,
  );

  const reserved = await withTransaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: events.id,
        title: events.title,
        availableBalance: events.availableBalance,
      })
      .from(events)
      .where(
        and(eq(events.id, input.eventId), eq(events.createdBy, input.organizerId)),
      )
      .limit(1);

    if (!eventRow) {
      throw new ValidationError("Event not found.");
    }

    if (eventRow.availableBalance < input.amount) {
      throw new ValidationError("Withdrawal amount exceeds the available event balance.");
    }

    const [updatedEvent] = await tx
      .update(events)
      .set({
        availableBalance: sql`${events.availableBalance} - ${input.amount}`,
      })
      .where(
        and(
          eq(events.id, input.eventId),
          eq(events.createdBy, input.organizerId),
          sql`${events.availableBalance} >= ${input.amount}`,
        ),
      )
      .returning({
        id: events.id,
        title: events.title,
      });

    if (!updatedEvent) {
      throw new ValidationError("Withdrawal amount exceeds the available event balance.");
    }

    const [withdrawal] = await tx
      .insert(eventWithdrawals)
      .values({
        eventId: input.eventId,
        organizerId: input.organizerId,
        amount: input.amount,
        currency: "RWF",
        destinationPhone,
        status: "processing",
        providerName: "intouch",
        requestTransactionId,
        reason:
          input.reason?.trim() ||
          `Withdrawal for event ${updatedEvent.title} (#${updatedEvent.id})`,
        timestamp: now,
      })
      .returning();

    if (!withdrawal) {
      throw new ValidationError("Failed to create withdrawal.");
    }

    return withdrawal;
  });

  try {
    const response = await requestConfiguredDeposit({
      config: {
        baseUrl: env.INTOUCH_BASE_URL,
        username: env.INTOUCH_USERNAME,
        accountNo: env.INTOUCH_ACCOUNT_NO,
        partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
      },
      amount: input.amount,
      mobilePhone: destinationPhone,
      requestTransactionId,
      reason: reserved.reason ?? `Withdrawal ${reserved.id}`,
      withdrawCharge: 1,
      sid: 1,
    });

    if (response.success && response.state === "succeeded") {
      return confirmEventWithdrawalSuccess({
        withdrawalId: reserved.id,
        providerReferenceId: response.referenceId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
    }

    if (!response.success && response.state === "failed") {
      return failEventWithdrawal({
        withdrawalId: reserved.id,
        providerReferenceId: response.referenceId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
    }

    const [updated] = await db
      .update(eventWithdrawals)
      .set({
        providerReferenceId: response.referenceId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      })
      .where(eq(eventWithdrawals.id, reserved.id))
      .returning();

    return updated ?? reserved;
  } catch (error) {
    return failEventWithdrawal({
      withdrawalId: reserved.id,
      providerStatusCode: "REQUEST_FAILED",
      rawProviderStatus: {
        reason: "Failed to reach provider during withdrawal initiation.",
        message: error instanceof Error ? error.message : "Unknown provider error",
      },
    });
  }
}

export async function confirmEventWithdrawalSuccess(input: {
  withdrawalId: number;
  providerReferenceId?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
}): Promise<EventWithdrawalRow> {
  return withTransaction(async (tx) => {
    const withdrawal = await getEventWithdrawalById(input.withdrawalId, tx);

    if (!withdrawal) {
      throw new ValidationError("Withdrawal not found.");
    }

    if (withdrawal.status === "succeeded") {
      return withdrawal;
    }

    if (withdrawal.status === "failed") {
      await tx
        .update(events)
        .set({
          availableBalance: sql`${events.availableBalance} - ${withdrawal.amount}`,
          totalWithdrawals: sql`${events.totalWithdrawals} + ${withdrawal.amount}`,
        })
        .where(eq(events.id, withdrawal.eventId));
    } else {
      await tx
        .update(events)
        .set({
          totalWithdrawals: sql`${events.totalWithdrawals} + ${withdrawal.amount}`,
        })
        .where(eq(events.id, withdrawal.eventId));
    }

    const [updated] = await tx
      .update(eventWithdrawals)
      .set({
        status: "succeeded",
        providerReferenceId:
          input.providerReferenceId ?? withdrawal.providerReferenceId,
        providerStatusCode: input.providerStatusCode ?? withdrawal.providerStatusCode,
        rawProviderStatus: input.rawProviderStatus ?? withdrawal.rawProviderStatus,
      })
      .where(eq(eventWithdrawals.id, withdrawal.id))
      .returning();

    if (!updated) {
      throw new ValidationError("Failed to confirm withdrawal.");
    }

    return updated;
  });
}

export async function failEventWithdrawal(input: {
  withdrawalId: number;
  providerReferenceId?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
}): Promise<EventWithdrawalRow> {
  return withTransaction(async (tx) => {
    const withdrawal = await getEventWithdrawalById(input.withdrawalId, tx);

    if (!withdrawal) {
      throw new ValidationError("Withdrawal not found.");
    }

    if (withdrawal.status === "failed") {
      return withdrawal;
    }

    if (withdrawal.status === "processing") {
      await tx
        .update(events)
        .set({
          availableBalance: sql`${events.availableBalance} + ${withdrawal.amount}`,
        })
        .where(eq(events.id, withdrawal.eventId));
    }

    if (withdrawal.status === "succeeded") {
      await tx
        .update(events)
        .set({
          availableBalance: sql`${events.availableBalance} + ${withdrawal.amount}`,
          totalWithdrawals: sql`${events.totalWithdrawals} - ${withdrawal.amount}`,
        })
        .where(eq(events.id, withdrawal.eventId));
    }

    const [updated] = await tx
      .update(eventWithdrawals)
      .set({
        status: "failed",
        providerReferenceId:
          input.providerReferenceId ?? withdrawal.providerReferenceId,
        providerStatusCode: input.providerStatusCode ?? withdrawal.providerStatusCode,
        rawProviderStatus: input.rawProviderStatus ?? withdrawal.rawProviderStatus,
      })
      .where(eq(eventWithdrawals.id, withdrawal.id))
      .returning();

    if (!updated) {
      throw new ValidationError("Failed to fail withdrawal.");
    }

    return updated;
  });
}

export async function refreshEventWithdrawalStatus(
  withdrawal: EventWithdrawalRow,
): Promise<EventWithdrawalRow> {
  if (
    withdrawal.status !== "processing" ||
    !withdrawal.requestTransactionId
  ) {
    return withdrawal;
  }

  assertIntouchConfigured();

  try {
    const response = await getTransactionStatus({
      baseUrl: env.INTOUCH_BASE_URL!,
      username: env.INTOUCH_USERNAME!,
      accountNo: env.INTOUCH_ACCOUNT_NO!,
      partnerPassword: env.INTOUCH_PARTNER_PASSWORD!,
      requestTransactionId: withdrawal.requestTransactionId,
      transactionId:
        withdrawal.providerReferenceId ?? withdrawal.requestTransactionId,
    });

    if (response.state === "succeeded") {
      return confirmEventWithdrawalSuccess({
        withdrawalId: withdrawal.id,
        providerReferenceId: response.transactionId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
    }

    if (response.state === "failed") {
      return failEventWithdrawal({
        withdrawalId: withdrawal.id,
        providerReferenceId: response.transactionId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
    }

    const [updated] = await db
      .update(eventWithdrawals)
      .set({
        providerReferenceId: response.transactionId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      })
      .where(eq(eventWithdrawals.id, withdrawal.id))
      .returning();

    return updated ?? withdrawal;
  } catch {
    return withdrawal;
  }
}

export async function reconcileProcessingEventWithdrawals(
  options: {
    executor?: DbExecutor;
    now?: Date;
    maxAgeMinutes?: number;
  } = {},
): Promise<{ succeededWithdrawalIds: number[]; failedWithdrawalIds: number[] }> {
  const executor = options.executor ?? db;
  const now = options.now ?? new Date();
  const maxAgeMinutes = options.maxAgeMinutes ?? 5;
  const threshold = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);

  const conditions: SQL[] = [
    eq(eventWithdrawals.status, "processing"),
    lte(eventWithdrawals.timestamp, threshold),
  ];

  const rows = await executor
    .select()
    .from(eventWithdrawals)
    .where(and(...conditions))
    .orderBy(desc(eventWithdrawals.timestamp));

  if (rows.length === 0) {
    return { succeededWithdrawalIds: [], failedWithdrawalIds: [] };
  }

  const succeededWithdrawalIds: number[] = [];
  const failedWithdrawalIds: number[] = [];

  for (const withdrawal of rows) {
    const refreshed = await refreshEventWithdrawalStatus(withdrawal);
    if (refreshed.status === "succeeded") {
      succeededWithdrawalIds.push(refreshed.id);
    } else if (refreshed.status === "failed") {
      failedWithdrawalIds.push(refreshed.id);
    }
  }

  return { succeededWithdrawalIds, failedWithdrawalIds };
}
