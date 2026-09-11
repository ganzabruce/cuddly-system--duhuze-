import type { eventPayments } from "@/lib/db/schema";
import type { DbExecutor } from "@/lib/db/serverless";

export type EventPaymentRow = typeof eventPayments.$inferSelect;

export type RsvpContext = {
  rsvpStatus: string;
  rsvpNote: string | null;
  additionalGuestCount: number;
  additionalGuests: Array<{
    name?: string | null;
    categoryId?: string | null;
    categoryLabel?: string | null;
    contributionAmount?: number;
  }>;
  customQuestionResponses: Array<{ label: string; answer: string }>;
  contributionAmount: number | null;
  currency: string | null;
};

export type CreatePendingEventPaymentAttemptInput = {
  eventId: number;
  guestId: number;
  organizerId: number;
  amount: number;
  currency: string;
  providerName: "intouch";
  payerPhone: string | null;
  payerName: string;
  rsvpContext?: RsvpContext | null;
  expiresAt?: Date | null;
  executor?: DbExecutor;
};

export type StartEventPaymentInput = {
  eventId: number;
  guestId: number;
  organizerId: number;
  amount: number;
  currency: string;
  payerPhone: string | null;
  payerName: string;
  payerEmail?: string | null;
  paymentMethod: "mobile_money";
  callbackUrl?: string | null;
  rsvpContext?: RsvpContext | null;
};

export type StartEventPaymentResult = {
  payment: EventPaymentRow;
  redirectUrl: string | null;
};

export type FinalizeSuccessInput = {
  paymentId: number;
  providerTransactionId?: string | null;
  providerReferenceNo?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
  paidAt?: Date;
};

export type FinalizeFailureInput = {
  paymentId: number;
  status?: "failed" | "expired";
  providerTransactionId?: string | null;
  providerReferenceNo?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
};
