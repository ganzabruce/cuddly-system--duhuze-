"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { isSupportedCurrency } from "@/lib/constants/billing/currencies";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import {
  parseCheckbox,
  parseBoundedInteger,
  parseContributionAmount,
  parseEventCoreFields,
  parseRsvpAccessMode,
  normalizeOptionalString,
} from "@/lib/services/events/form-utils";
import {
  parseAttendeeCategories,
  parseCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import { createEvent as createEventService } from "@/actions/events/create-event";
import {
  DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP,
  MAX_ADDITIONAL_GUESTS_PER_RSVP,
} from "@/lib/constants/events/rsvp-limits";

export type CreateEventState = { error: string | null };

export async function createEventFromForm(
  _prevState: CreateEventState | null,
  formData: FormData,
): Promise<CreateEventState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const coreResult = parseEventCoreFields(formData, { requireLocationType: true });
  if (coreResult.error || !coreResult.value) {
    return { error: coreResult.error ?? "Invalid event data" };
  }
  const {
    title,
    description,
    category,
    date,
    endDate,
    timezone,
    locationType,
    locationName,
    safeLocationLink,
    image,
    imageFormat,
    visibility,
    effectiveStatus,
  } = coreResult.value;

  const contributionAmountRaw = formData.get("contributionAmount");
  const contributionPaymentInfoRaw = formData.get("contributionPaymentInfo");
  const contributionCollectionModeRaw = formData.get("contributionCollectionMode");
  const currencyRaw = formData.get("currency");
  const currencyCandidate =
    typeof currencyRaw === "string" ? currencyRaw.trim().toUpperCase() : "RWF";
  const currency = isSupportedCurrency(currencyCandidate)
    ? currencyCandidate
    : "RWF";
  const contributionPaymentInfo = normalizeOptionalString(contributionPaymentInfoRaw);
  const requireApproval = parseCheckbox(formData.get("requireApproval"));
  const rsvpAccessMode = parseRsvpAccessMode(formData.get("rsvpAccessMode"));
  const allowAdditionalGuests = parseCheckbox(
    formData.get("allowAdditionalGuests"),
  );
  const attendeeCategoriesRaw = formData.get("attendeeCategories");
  const attendeeCategoriesResult = parseAttendeeCategories(attendeeCategoriesRaw);
  if (attendeeCategoriesResult.error) {
    return { error: attendeeCategoriesResult.error };
  }
  const attendeeCategories = attendeeCategoriesResult.value ?? null;
  const hasCategoryPricing =
    attendeeCategories?.some((category) => category.contributionAmount > 0) ??
    false;
  const maxCapacityRaw = formData.get("maxCapacity");
  const maxAdditionalGuestsRaw = formData.get("maxAdditionalGuests");
  const maxCapacityResult = parseBoundedInteger(maxCapacityRaw, {
    min: 1,
    max: 10000,
    errorMessage: "Max capacity must be between 1 and 10000",
  });
  if (maxCapacityResult.error) {
    return { error: maxCapacityResult.error };
  }
  const maxCapacity = maxCapacityResult.value;
  const maxAdditionalGuestsResult = parseBoundedInteger(maxAdditionalGuestsRaw, {
    min: 1,
    max: MAX_ADDITIONAL_GUESTS_PER_RSVP,
    errorMessage: `Max additional guests must be between 1 and ${MAX_ADDITIONAL_GUESTS_PER_RSVP}`,
  });
  if (maxAdditionalGuestsResult.error) {
    return { error: maxAdditionalGuestsResult.error };
  }
  const hasAttendeeCategories = (attendeeCategories?.length ?? 0) > 0;
  const effectiveAllowAdditionalGuests =
    allowAdditionalGuests || hasAttendeeCategories;
  const maxAdditionalGuests = effectiveAllowAdditionalGuests
    ? (maxAdditionalGuestsResult.value ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
    : null;
  const contributionAmountResult = parseContributionAmount(contributionAmountRaw);
  if (contributionAmountResult.error) {
    return { error: contributionAmountResult.error };
  }
  const contributionAmount = contributionAmountResult.value;
  const contributionCollectionMode =
    contributionCollectionModeRaw === "platform"
      ? "platform"
      : contributionCollectionModeRaw === "optional"
        ? "optional"
        : "offline";

  const customRsvpQuestionsRaw = formData.get("customRsvpQuestions");
  const customQuestionsResult = parseCustomQuestions(customRsvpQuestionsRaw);
  if (customQuestionsResult.error) {
    return { error: customQuestionsResult.error };
  }
  const customQuestions = customQuestionsResult.value ?? null;
  if (
    contributionCollectionMode === "platform" &&
    !hasCategoryPricing &&
    (contributionAmount == null || contributionAmount <= 0)
  ) {
    return { error: "Contribution amount is required." };
  }

  const result = await createEventService(
    {
      title,
      description: description ?? undefined,
      category: category || undefined,
      date,
      endDate: endDate || undefined,
      timezone: timezone || undefined,
      locationType,
      locationName,
      locationLink: safeLocationLink ?? undefined,
      image: image ?? undefined,
      imageFormat,
      visibility,
      status: effectiveStatus as
        | "draft"
        | "published"
        | "completed"
        | "cancelled",
      maxCapacity,
      contributionCollectionMode,
      contributionAmount: hasCategoryPricing ? null : contributionAmount,
      contributionPaymentInfo:
        contributionCollectionMode === "offline"
          ? contributionPaymentInfo || null
          : null,
      customQuestions,
      attendeeCategories,
      rsvpAccessMode,
      requireApproval,
      allowAdditionalGuests: effectiveAllowAdditionalGuests,
      maxAdditionalGuests,
      currency,
    },
    user.id,
  ).catch((error: unknown) => {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create event" };
  });

  if ("error" in result) {
    return { error: result.error };
  }

  if (!user.username) {
    return { error: "Set a username before creating events." };
  }

  revalidatePath("/app/events");
  revalidatePath(getPublicEventPath(user.username, result.slug));

  redirect(`/app/events/${result.slug}`);
}
