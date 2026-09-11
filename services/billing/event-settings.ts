import { eq } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { eventSettings } from "@/lib/db/schema";
import type { EventSettingsAccessState } from "@/types/billing";

export async function getEventSettingsAccessState(
  eventId: number,
  executor: DbExecutor = db,
): Promise<EventSettingsAccessState> {
  const [row] = await executor
    .select({
      guestCapacity: eventSettings.guestCapacity,
      rsvpAccessMode: eventSettings.rsvpAccessMode,
      requireApproval: eventSettings.requireApproval,
      allowAdditionalGuests: eventSettings.allowAdditionalGuests,
      maxAdditionalGuests: eventSettings.maxAdditionalGuests,
      contributionCollectionMode: eventSettings.contributionCollectionMode,
      contributionAmount: eventSettings.contributionAmount,
      contributionPaymentInfo: eventSettings.contributionPaymentInfo,
      attendeeCategories: eventSettings.attendeeCategories,
      customQuestions: eventSettings.customQuestions,
      whatsappEnabled: eventSettings.whatsappEnabled,
    })
    .from(eventSettings)
    .where(eq(eventSettings.eventId, eventId))
    .limit(1);

  return {
    guestCapacity: row?.guestCapacity ?? null,
    rsvpAccessMode: row?.rsvpAccessMode ?? "open_rsvp",
    requireApproval: row?.requireApproval ?? false,
    allowAdditionalGuests: row?.allowAdditionalGuests ?? false,
    maxAdditionalGuests: row?.maxAdditionalGuests ?? null,
    contributionCollectionMode: row?.contributionCollectionMode ?? "offline",
    contributionAmount: row?.contributionAmount ?? null,
    contributionPaymentInfo: row?.contributionPaymentInfo ?? null,
    attendeeCategories: row?.attendeeCategories ?? null,
    customQuestions: row?.customQuestions ?? null,
    whatsappEnabled: row?.whatsappEnabled ?? true,
  };
}

export function didAdvancedEventSettingsChange(input: {
  current: {
    guestCapacity: number | null;
    rsvpAccessMode: "open_rsvp" | "invite_only";
    requireApproval: boolean;
    allowAdditionalGuests: boolean;
    maxAdditionalGuests: number | null;
  };
  next: {
    guestCapacity: number | null;
    rsvpAccessMode: "open_rsvp" | "invite_only";
    requireApproval: boolean;
    allowAdditionalGuests: boolean;
    maxAdditionalGuests: number | null;
  };
}) {
  return (
    input.current.guestCapacity !== input.next.guestCapacity ||
    input.current.rsvpAccessMode !== input.next.rsvpAccessMode ||
    input.current.requireApproval !== input.next.requireApproval ||
    input.current.allowAdditionalGuests !== input.next.allowAdditionalGuests ||
    input.current.maxAdditionalGuests !== input.next.maxAdditionalGuests
  );
}

export function didCustomQuestionsChange(
  current: unknown,
  next: unknown,
): boolean {
  return JSON.stringify(current ?? null) !== JSON.stringify(next ?? null);
}

export function didEventContributionsChange(input: {
  current: {
    contributionCollectionMode: "offline" | "platform" | "optional";
    contributionAmount: number | null;
    contributionPaymentInfo: string | null;
  };
  next: {
    contributionCollectionMode: "offline" | "platform" | "optional";
    contributionAmount: number | null;
    contributionPaymentInfo: string | null;
  };
}) {
  return (
    input.current.contributionCollectionMode !==
      input.next.contributionCollectionMode ||
    input.current.contributionAmount !== input.next.contributionAmount ||
    (input.current.contributionPaymentInfo ?? null) !==
      (input.next.contributionPaymentInfo ?? null)
  );
}

export function didAttendeeCategoriesChange(
  current: unknown,
  next: unknown,
): boolean {
  return JSON.stringify(current ?? null) !== JSON.stringify(next ?? null);
}
