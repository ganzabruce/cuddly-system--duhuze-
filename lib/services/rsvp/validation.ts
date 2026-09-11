import { MAX_TEXTAREA_ANSWER_LENGTH } from "@/lib/constants/events/rsvp-limits";
import { toE164 } from "@/lib/utils/phone";
import type { AttendeeCategory } from "@/types/events";
import {
  normalizeCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import type {
  AdditionalGuestDetail,
  FormState,
  RsvpRouteParams,
  RsvpStatus,
} from "@/types/rsvp";

export interface RsvpFieldErrors {
  name?: string;
  email?: string;
  rsvpStatus?: string;
  rsvpNote?: string;
}

export function validateRsvpCoreFields(params: {
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  rsvpStatus?: string | null;
  rsvpNote?: string | null;
  required?: boolean;
}): { ok: true } | { ok: false; errors: RsvpFieldErrors } {
  const errors: RsvpFieldErrors = {};
  const { name, email, phoneNumber, rsvpStatus, rsvpNote, required = true } = params;

  if (required || name != null) {
    if (name == null || name.trim().length === 0) {
      errors.name = "Name is required";
    } else if (name.trim().length > 255) {
      errors.name = "Name must be less than 255 characters";
    }
  }

  const hasEmail = email != null && email.trim().length > 0;
  const hasPhone = phoneNumber != null && phoneNumber.trim().length > 0;

  if (required && !hasEmail && !hasPhone) {
    errors.email = "Please provide an email address or phone number";
  }

  if (hasEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email!)) {
      errors.email = "Please enter a valid email address";
    } else if (email!.trim().length > 255) {
      errors.email = "Email must be less than 255 characters";
    }
  }

  if (rsvpStatus == null || !["yes", "no", "maybe"].includes(rsvpStatus)) {
    errors.rsvpStatus = "Please select your attendance status";
  }

  if (rsvpNote && rsvpNote.length > 1000) {
    errors.rsvpNote = "Notes must be less than 1000 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

export function validateAdditionalGuestsCore(params: {
  items: Array<{
    name?: string | null;
    email?: string | null | undefined;
    categoryId?: string | null;
  }>;
  count: number;
  allowAdditionalGuests: boolean;
  rsvpStatus: string;
  attendeeCategories: AttendeeCategory[];
}): { ok: true; guests: AdditionalGuestDetail[] } | { ok: false; error: string } {
  const { items, count, allowAdditionalGuests, rsvpStatus, attendeeCategories } = params;

  if (!allowAdditionalGuests || count <= 0 || rsvpStatus !== "yes") {
    return { ok: true, guests: [] };
  }

  const guestsToInsert: AdditionalGuestDetail[] = [];
  for (let i = 0; i < count; i += 1) {
    const item = items[i] ?? {};
    const trimmedName = item.name?.trim() || null;
    const trimmedEmail: string | null =
      typeof item.email === "string" ? item.email.trim() || null
      : item.email === null ? null
      : null;
    const trimmedCategoryId = item.categoryId?.trim() || null;

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { ok: false, error: "Please check the email addresses for your additional guests." };
    }

    const category = attendeeCategories.length
      ? attendeeCategories.find((cat) => cat.id === trimmedCategoryId) ?? null
      : null;

    if (attendeeCategories.length > 0 && !category) {
      return {
        ok: false,
        error: "Please choose a category for each additional guest.",
      };
    }

    guestsToInsert.push({
      name: trimmedName,
      email: trimmedEmail,
      categoryId: category?.id ?? null,
      categoryLabel: category?.label ?? null,
      sortOrder: i,
    });
  }

  return { ok: true, guests: guestsToInsert };
}

export function getString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

export function extractRsvpRouteParams(formData: FormData): RsvpRouteParams | null {
  const eventIdRaw = getString(formData, "eventId");
  const eventId = eventIdRaw !== null ? parseInt(eventIdRaw, 10) : NaN;
  const username = getString(formData, "username");
  const eventSlug = getString(formData, "eventSlug");

  if (Number.isNaN(eventId) || !username?.trim() || !eventSlug?.trim()) {
    return null;
  }

  return { eventId, username: username.trim(), eventSlug: eventSlug.trim() };
}

export function validateRsvpFields(formData: FormData): {
  ok: true;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  rsvpStatus: RsvpStatus;
  rsvpNote: string | null;
  inviteToken: string | null;
  additionalGuestCountRaw: string | null;
} | {
  ok: false;
  errors: FormState["errors"];
} {
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const rsvpStatus = getString(formData, "rsvpStatus");
  const rsvpNoteRaw = getString(formData, "rsvpNote");
  const rsvpNote = rsvpNoteRaw?.trim() || null;
  const phoneNumberRaw = getString(formData, "phoneNumber");
  const phoneNumber = phoneNumberRaw ? toE164(phoneNumberRaw) : null;
  const inviteTokenRaw = getString(formData, "inviteToken");
  const inviteToken = inviteTokenRaw?.trim() || null;
  const additionalGuestCountRaw = getString(formData, "additionalGuestCount");

  const coreResult = validateRsvpCoreFields({ name, email, phoneNumber: phoneNumberRaw, rsvpStatus, rsvpNote, required: true });
  if (!coreResult.ok) {
    return { ok: false, errors: coreResult.errors as FormState["errors"] };
  }

  const trimmedEmail = email?.trim() || null;

  return {
    ok: true,
    name: name!.trim(),
    email: trimmedEmail || null,
    phoneNumber,
    rsvpStatus: rsvpStatus as RsvpStatus,
    rsvpNote,
    inviteToken,
    additionalGuestCountRaw,
  };
}

function validateQuestionAnswer(
  answer: string,
  question: { type?: string; options?: string[]; id: string; required?: boolean },
): { ok: true; value: string } | { ok: false; error: string } {
  const type = question.type ?? "text";

  if (type === "textarea") {
    if (answer.length > MAX_TEXTAREA_ANSWER_LENGTH) {
      return {
        ok: false,
        error: `Long text answers must be ${MAX_TEXTAREA_ANSWER_LENGTH} characters or less.`,
      };
    }
    return { ok: true, value: answer };
  }

  if (type === "yesno") {
    if (answer !== "yes" && answer !== "no") {
      return { ok: false, error: "Please answer all yes/no questions correctly." };
    }
    return { ok: true, value: answer };
  }

  if (type === "select") {
    if (!question.options?.includes(answer)) {
      return { ok: false, error: "Please choose a valid answer from the list." };
    }
    return { ok: true, value: answer };
  }

  if (type === "multiselect") {
    try {
      const parsed = JSON.parse(answer);
      if (
        !Array.isArray(parsed) ||
        (question.required && parsed.length === 0) ||
        parsed.some(
          (item) => typeof item !== "string" || !question.options?.includes(item),
        )
      ) {
        return { ok: false, error: "Please choose valid options." };
      }
      return { ok: true, value: JSON.stringify(parsed) };
    } catch {
      return { ok: false, error: "Please choose valid options." };
    }
  }

  if (answer.length > 1000) {
    return { ok: false, error: "Each custom question answer must be 1000 characters or less." };
  }

  return { ok: true, value: answer };
}

export function validateCustomQuestionResponses(
  input: Record<string, string> | null | undefined,
  rawQuestions: unknown,
  options?: { skipRequired?: boolean },
): { ok: true; responses: Record<string, string> | null } | { ok: false; error: string } {
  const configuredCustomQuestions = normalizeCustomQuestions(rawQuestions);
  if (configuredCustomQuestions.length === 0) {
    return { ok: true, responses: null };
  }

  const responses: Record<string, string> = {};

  for (const question of configuredCustomQuestions) {
    const value = input?.[question.id];
    const answer = typeof value === "string" ? value.trim() : "";

    if (!options?.skipRequired && question.required && answer.length === 0) {
      return { ok: false, error: "Please answer all required custom questions." };
    }

    if (answer.length === 0) {
      continue;
    }

    const result = validateQuestionAnswer(answer, question);
    if (!result.ok) {
      return result;
    }
    responses[question.id] = result.value;
  }

  return { ok: true, responses: Object.keys(responses).length > 0 ? responses : null };
}

export function extractCustomQuestionAnswers(
  formData: FormData,
  rawQuestions: unknown,
): Record<string, string> {
  const questions = normalizeCustomQuestions(rawQuestions);
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const v = getString(formData, `cq_${q.id}`)?.trim() ?? "";
    if (v) answers[q.id] = v;
  }
  return answers;
}

export function parseAdditionalGuestCount(
  raw: string | null,
  allowAdditionalGuests: boolean,
  maxAdditionalGuests: number,
): { ok: true; count: number } | { ok: false; error: string } {
  if (!allowAdditionalGuests || raw == null || raw.trim().length === 0) {
    return { ok: true, count: 0 };
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { ok: false, error: "Additional guests must be a non-negative number" };
  }
  if (parsed > maxAdditionalGuests) {
    return { ok: false, error: `You can only bring up to ${maxAdditionalGuests} additional guests` };
  }
  return { ok: true, count: parsed };
}

export function parseAdditionalGuestDetails(
  formData: FormData,
  count: number,
  allowAdditionalGuests: boolean,
  rsvpStatus: string,
  attendeeCategories: AttendeeCategory[],
): { ok: true; guests: AdditionalGuestDetail[]; count: number } | { ok: false; error: string } {
  const items = Array.from({ length: count }, (_, i) => ({
    name: getString(formData, `additionalGuest_${i}_name`),
    email: getString(formData, `additionalGuest_${i}_email`),
    categoryId: getString(formData, `additionalGuest_${i}_categoryId`),
  }));

  const result = validateAdditionalGuestsCore({
    items,
    count,
    allowAdditionalGuests,
    rsvpStatus,
    attendeeCategories,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, guests: result.guests, count };
}
