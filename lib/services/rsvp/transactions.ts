import { withTransaction } from "@/lib/db/serverless";
import { CapacityExceededError } from "@/lib/utils/errors";
import { getEventCapacityInfo } from "@/actions/events/get-event-capacity";
import type { AdditionalGuestDetail, RsvpStatus } from "@/types/rsvp";
import {
  resolveExistingGuest,
  persistGuestUpsert,
  calculateUpdatedSeatUsage,
} from "./guest-persistence";
import type { NullableRsvpStatus } from "./guest-persistence";

export type RsvpWriteResult =
  | {
      ok: true;
      guestToken: string;
      guestId: number;
      hadExistingGuest: boolean;
      isFirstResponse: boolean;
      isInviteOnly: boolean;
    }
  | { ok: false; message: string };

export interface RsvpWriteParams {
  eventId: number;
  normalizedEmail: string | null;
  nameValue: string;
  emailValue: string | null;
  phoneNumber: string | null;

  resolveGuest?: {
    visibility: string | null;
    rsvpAccessMode: string | null;
    inviteToken: string | null;
  };

  preResolvedGuest?: {
    id: number;
    rsvpStatus: NullableRsvpStatus;
    guestToken: string | null;
    additionalGuestCount: number | null;
  };

  rsvpStatus: RsvpStatus;
  rsvpNote: string | null;
  additionalGuestCount: number;
  additionalGuestsToInsert: AdditionalGuestDetail[];
  customQuestionResponses: Record<string, string> | null;
  paymentShouldStart: boolean;
}

export async function executeRsvpWriteTransaction(
  params: RsvpWriteParams,
): Promise<RsvpWriteResult> {
  try {
    return await withTransaction(async (tx) => {
      let guest: {
        id: number;
        rsvpStatus: NullableRsvpStatus;
        guestToken: string | null;
        additionalGuestCount: number | null;
      } | undefined;
      let isInviteOnly = false;

      if (params.resolveGuest) {
        const result = await resolveExistingGuest({
          eventId: params.eventId,
          normalizedEmail: params.normalizedEmail,
          phoneNumber: params.phoneNumber,
          visibility: params.resolveGuest.visibility,
          rsvpAccessMode: params.resolveGuest.rsvpAccessMode,
          inviteToken: params.resolveGuest.inviteToken,
          executor: tx,
        });
        if (!result.ok) {
          return { ok: false as const, message: result.message };
        }
        guest = result.guest;
        isInviteOnly = result.isInviteOnly;
      } else if (params.preResolvedGuest) {
        guest = params.preResolvedGuest;
        isInviteOnly = false;
      }

      if (params.rsvpStatus === "yes") {
        const capacityInfo = await getEventCapacityInfo(params.eventId, tx);
        if (capacityInfo.guestCapacity != null) {
          const nextSeatUsage = calculateUpdatedSeatUsage({
            totalSeatsUsed: capacityInfo.totalSeatsUsed,
            existingStatus: guest?.rsvpStatus ?? "no",
            existingAdditionalGuestCount: guest?.additionalGuestCount ?? 0,
            nextStatus: params.paymentShouldStart ? null : "yes",
            nextAdditionalGuestCount: params.additionalGuestCount,
          });

          if (nextSeatUsage > capacityInfo.guestCapacity) {
            return {
              ok: false as const,
              message:
                "This event has reached its capacity. You can still choose No or Maybe.",
            };
          }
        }
      }

      const persistedStatus: NullableRsvpStatus = params.paymentShouldStart
        ? null
        : params.rsvpStatus;
      const respondedAt = params.paymentShouldStart ? null : new Date();

      const { guestToken, guestId } = await persistGuestUpsert({
        tx,
        eventId: params.eventId,
        nameValue: params.nameValue,
        emailValue: params.emailValue,
        phoneNumber: params.phoneNumber,
        rsvpStatus: persistedStatus,
        rsvpNote: params.rsvpNote,
        additionalGuestCount: params.additionalGuestCount,
        customQuestionResponses: params.customQuestionResponses,
        isInviteOnly,
        normalizedEmail: params.normalizedEmail,
        additionalGuestsToInsert: params.additionalGuestsToInsert,
        existingGuest: guest,
        respondedAt,
      });

      return {
        ok: true as const,
        guestToken,
        guestId,
        hadExistingGuest: Boolean(guest),
        isFirstResponse: !guest?.rsvpStatus,
        isInviteOnly,
      };
    });
  } catch (err) {
    if (err instanceof CapacityExceededError) {
      return {
        ok: false as const,
        message:
          "This event has reached its capacity. You can still choose No or Maybe.",
      };
    }
    throw err;
  }
}
