// Two notification paths are intentional:
// - Guest emails: sent directly via sendRsvpConfirmationEmail / sendRsvpUpdateEmail (transactional, always delivered)
// - Organizer notifications: routed through publishNotification (catalog-driven, channel-aware)
import { sendRsvpConfirmationEmail, sendRsvpUpdateEmail } from "@/lib/email/send";
import {
  getRsvpResponseMessage,
  sendWhatsAppRsvpConfirmation,
} from "@/lib/services/guests/messaging";
import { buildEmailQrImageUrl } from "@/lib/services/events/qr";
import { getPublicEventGuestPath } from "@/lib/constants/events/profile-paths";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventGuestsLink } from "@/lib/services/notifications/links";
import type { AttendeeCategory } from "@/types/events";
import {
  normalizeAttendeeCategories,
  normalizeCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import { getAppBaseUrl } from "@/lib/utils/url";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import logger from "@/lib/utils/logger";

type RsvpStatus = "yes" | "no" | "maybe";

type AdditionalGuestEmailDetail = {
  name?: string | null;
  categoryLabel?: string | null;
  categoryId?: string | null;
};

type CustomQuestionAnswer = {
  label: string;
  answer: string;
};

export function formatCustomQuestionResponses(
  responses: Record<string, string> | null,
  rawQuestions: unknown,
): CustomQuestionAnswer[] {
  if (!responses) return [];

  return normalizeCustomQuestions(rawQuestions)
    .map((question) => {
      const answer = responses[question.id];
      if (!answer) return null;

      let displayAnswer = answer;
      if (question.type === "yesno") {
        displayAnswer = answer === "yes" ? "Yes" : "No";
      } else if (question.type === "multiselect") {
        try {
          const parsed = JSON.parse(answer);
          if (Array.isArray(parsed)) {
            displayAnswer = parsed.join(", ");
          }
        } catch {
          // Keep the original answer if parsing fails.
        }
      }

      return { label: question.label, answer: displayAnswer };
    })
    .filter((item): item is CustomQuestionAnswer => item !== null);
}

export function mapAdditionalGuestsForEmail(
  additionalGuests: AdditionalGuestEmailDetail[],
  attendeeCategories: AttendeeCategory[] | unknown,
) {
  const normalizedCategories = normalizeAttendeeCategories(attendeeCategories);

  return additionalGuests.map((guest) => {
    const category = guest.categoryId
      ? normalizedCategories.find((item) => item.id === guest.categoryId)
      : null;

    return {
      name: guest.name,
      categoryLabel: guest.categoryLabel,
      contributionAmount: category?.contributionAmount,
    };
  });
}

export async function sendRsvpConfirmationSideEffects(params: {
  to: string | null;
  guestName: string;
  guestEmail: string | null;
  guestPhone?: string | null;
  guestToken: string | null;
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  eventDate: Date;
  eventTimezone: string;
  eventUsername: string;
  organizerId: number;
  rsvpStatus: RsvpStatus;
  rsvpNote: string | null;
  additionalGuestCount: number;
  additionalGuests?: Array<{
    name?: string | null;
    categoryLabel?: string | null;
    contributionAmount?: number;
  }>;
  customQuestionResponses?: CustomQuestionAnswer[];
  notificationType: "rsvp_received" | "rsvp_updated";
  locationName?: string | null;
  locationLink?: string | null;
  locationType?: "online" | "in_person" | null;
  contributionRequired?: boolean | null;
  contributionAmount?: number | null;
  contributionPaymentInfo?: string | null;
  currency?: string | null;
}) {
  const baseUrl = getAppBaseUrl();
  const managePath = params.guestToken
    ? getPublicEventGuestPath(
        params.eventUsername,
        params.eventSlug,
        params.guestToken,
      )
    : null;
  const manageLink = managePath ? `${baseUrl}${managePath}` : baseUrl;
  const qrImageUrl = managePath ? buildEmailQrImageUrl(manageLink) : undefined;

  if (params.to) {
    try {
      const result = await sendRsvpConfirmationEmail({
        to: params.to,
        guestName: params.guestName,
        eventTitle: params.eventTitle,
        rsvpStatus: params.rsvpStatus,
        eventDate: formatEventDate(params.eventDate, { timezone: params.eventTimezone }),
        eventTime: formatEventTime(params.eventDate, { timezone: params.eventTimezone }),
        rsvpNote: params.rsvpNote,
        eventPageLink: manageLink,
        qrImageUrl,
        locationName: params.locationName ?? undefined,
        locationLink: params.locationLink ?? undefined,
        locationType: params.locationType ?? undefined,
        additionalGuests: params.additionalGuests,
        customQuestionResponses: params.customQuestionResponses,
        contributionRequired: params.contributionRequired ?? undefined,
        contributionAmount: params.contributionAmount ?? undefined,
        contributionPaymentInfo: params.contributionPaymentInfo,
        currency: params.currency ?? undefined,
      });

      if (!result.ok) {
        logger.warn("RSVP confirmation email failed", {
          email: params.to,
          eventId: params.eventId,
          error: result.error,
        });
      }
    } catch (error) {
      logger.warn("RSVP confirmation email preparation failed", {
        email: params.to,
        eventId: params.eventId,
        error,
      });
    }
  }

  if (params.guestPhone && managePath) {
    try {
      const eventDateTime = `${formatEventDate(params.eventDate, {
        timezone: params.eventTimezone,
      })} at ${formatEventTime(params.eventDate, { timezone: params.eventTimezone })}`;

      await sendWhatsAppRsvpConfirmation({
        guestName: params.guestName,
        guestPhone: params.guestPhone,
        guestResponseMessage: getRsvpResponseMessage(params.rsvpStatus),
        eventTitle: params.eventTitle,
        eventDateTime,
        guestLink: manageLink,
      });
    } catch (error) {
      logger.warn("RSVP confirmation WhatsApp failed", {
        eventId: params.eventId,
        error,
      });
    }
  }

  await publishNotification({
    type: params.notificationType,
    recipientUserIds: [params.organizerId],
    context: {
      eventId: params.eventId,
      eventSlug: params.eventSlug,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      link: dashboardEventGuestsLink(params.eventSlug),
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      rsvpStatus: params.rsvpStatus,
      additionalGuestCount: params.additionalGuestCount,
    },
  });
}

export async function sendRsvpUpdateSideEffects(params: {
  to: string | null;
  guestId: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone?: string | null;
  guestPageLink: string;
  eventId: number;
  eventSlug: string;
  eventTitle: string;
  eventDate: Date;
  eventTimezone: string;
  organizerId: number;
  rsvpStatus: RsvpStatus;
  rsvpNote: string | null;
  additionalGuestCount: number;
  additionalGuests?: Array<{
    name?: string | null;
    categoryLabel?: string | null;
    contributionAmount?: number;
  }>;
  customQuestionResponses?: CustomQuestionAnswer[];
  locationName?: string | null;
  locationLink?: string | null;
  locationType?: "online" | "in_person" | null;
  contributionRequired?: boolean;
  contributionAmount?: number;
  contributionPaymentInfo?: string | null;
  currency?: string | null;
}) {
  if (params.to) {
    const emailResult = await sendRsvpUpdateEmail({
      to: params.to,
      guestName: params.guestName,
      eventTitle: params.eventTitle,
      eventDate: formatEventDate(params.eventDate, { timezone: params.eventTimezone }),
      eventTime: formatEventTime(params.eventDate, { timezone: params.eventTimezone }),
      rsvpStatus: params.rsvpStatus,
      eventPageLink: params.guestPageLink,
      rsvpNote: params.rsvpNote,
      locationName: params.locationName ?? undefined,
      locationLink: params.locationLink ?? undefined,
      locationType: params.locationType ?? undefined,
      additionalGuests: params.additionalGuests,
      customQuestionResponses: params.customQuestionResponses,
      contributionRequired: params.contributionRequired,
      contributionAmount: params.contributionAmount,
      contributionPaymentInfo: params.contributionPaymentInfo,
      currency: params.currency ?? undefined,
    });

    if (!emailResult.ok) {
      logger.warn("RSVP update email failed", {
        email: params.to,
        guestId: params.guestId,
        eventId: params.eventId,
        error: emailResult.error,
      });
    }
  }

  if (params.guestPhone) {
    try {
      const eventDateTime = `${formatEventDate(params.eventDate, {
        timezone: params.eventTimezone,
      })} at ${formatEventTime(params.eventDate, { timezone: params.eventTimezone })}`;

      await sendWhatsAppRsvpConfirmation({
        guestName: params.guestName,
        guestPhone: params.guestPhone,
        guestResponseMessage: getRsvpResponseMessage(params.rsvpStatus),
        eventTitle: params.eventTitle,
        eventDateTime,
        guestLink: params.guestPageLink,
      });
    } catch (error) {
      logger.warn("RSVP update WhatsApp failed", {
        eventId: params.eventId,
        guestId: params.guestId,
        error,
      });
    }
  }

  await publishNotification({
    type: "rsvp_updated",
    recipientUserIds: [params.organizerId],
    context: {
      eventId: params.eventId,
      eventSlug: params.eventSlug,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      link: dashboardEventGuestsLink(params.eventSlug),
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      rsvpStatus: params.rsvpStatus,
      additionalGuestCount: params.additionalGuestCount,
    },
  });
}
