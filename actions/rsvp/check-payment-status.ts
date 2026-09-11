"use server";

import { sql } from "drizzle-orm";
import db from "@/lib/db";
import { guests } from "@/lib/db/schema";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";
import { getEventPaymentByRequestTransactionId } from "@/lib/services/events/payments/queries";
import { refreshEventPaymentStatus } from "@/actions/events/payments/status";
import logger from "@/lib/utils/logger";

// PUBLIC ACTION — no auth by design (token-scoped: guestToken/confirmationToken validated below)
export async function checkGuestEventPaymentStatusAction(
  token: string,
  requestTransactionId: string,
): Promise<{
  status: "pending" | "succeeded" | "failed" | "expired" | null;
  id: number | null;
}> {
  try {
    const normalizedToken = normalizeOpaqueToken(token);
    if (!normalizedToken || !requestTransactionId?.trim()) {
      return { status: null, id: null };
    }

    const [guestRow] = await db
      .select({ id: guests.id })
      .from(guests)
      .where(
        sql`${guests.guestToken} = ${normalizedToken} OR ${guests.confirmationToken} = ${normalizedToken}`,
      )
      .limit(1);

    if (!guestRow) {
      return { status: null, id: null };
    }

    const paymentRow = await getEventPaymentByRequestTransactionId(
      requestTransactionId.trim(),
    );

    if (!paymentRow || paymentRow.guestId !== guestRow.id) {
      return { status: null, id: null };
    }

    const refreshed =
      paymentRow.status === "pending"
        ? await refreshEventPaymentStatus(paymentRow.id)
        : paymentRow;

    return { status: refreshed.status, id: refreshed.id };
  } catch (error) {
    logger.error("Error checking event payment status", error);
    return { status: null, id: null };
  }
}
