import {
  MAX_ATTENDEE_CATEGORIES,
  MAX_CUSTOM_QUESTION_OPTIONS,
  MAX_CUSTOM_RSVP_QUESTIONS,
} from "@/lib/constants/events/rsvp-limits";
import type {
    AttendeeCategory,
    CustomRsvpQuestion,
    GuestRsvpSummary,
    GuestRsvpSummaryLine,
    QuestionType,
} from "@/types/events";

type AdditionalGuestRowLike = {
    categoryId?: string | null;
    categoryLabel?: string | null;
};

export const QUESTION_TYPES: QuestionType[] = [
    "text",
    "textarea",
    "yesno",
    "select",
    "multiselect",
];

function isQuestionType(value: unknown): value is QuestionType {
    return typeof value === "string" && QUESTION_TYPES.includes(value as QuestionType);
}

export function normalizeCustomQuestions(raw: unknown): CustomRsvpQuestion[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter(
            (item): item is Record<string, unknown> =>
                typeof item === "object" && item !== null,
        )
        .map((item) => {
            const type = isQuestionType(item.type) ? item.type : "text";
            const options = Array.isArray(item.options)
                ? item.options
                      .filter((option): option is string => typeof option === "string")
                      .map((option) => option.trim())
                      .filter(Boolean)
                : undefined;

            return {
                id: typeof item.id === "string" ? item.id : "",
                label: typeof item.label === "string" ? item.label : "",
                required: Boolean(item.required),
                type,
                options:
                    type === "select" || type === "multiselect"
                        ? options ?? []
                        : undefined,
            };
        })
        .filter((question) => question.id && question.label);
}

export function normalizeAttendeeCategories(raw: unknown): AttendeeCategory[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter(
            (item): item is Record<string, unknown> =>
                typeof item === "object" && item !== null,
        )
        .map((item, index) => ({
            id: typeof item.id === "string" ? item.id : "",
            label: typeof item.label === "string" ? item.label.trim() : "",
            contributionAmount:
                typeof item.contributionAmount === "number" &&
                Number.isFinite(item.contributionAmount)
                    ? Math.max(0, Math.floor(item.contributionAmount))
                    : 0,
            sortOrder:
                typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)
                    ? Math.max(0, Math.floor(item.sortOrder))
                    : index,
        }))
        .filter((category) => category.id && category.label)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizeCustomQuestionResponses(
    raw: unknown,
): Record<string, string> | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }

    const entries = Object.entries(raw).filter(
        (entry): entry is [string, string] =>
            typeof entry[0] === "string" && typeof entry[1] === "string",
    );

    if (entries.length === 0) {
        return null;
    }

    return Object.fromEntries(entries);
}

export function getPrimaryAttendeeCategory(
    categories: AttendeeCategory[],
): AttendeeCategory | null {
    return categories[0] ?? null;
}

export function getAttendeeCategoryById(
    categories: AttendeeCategory[],
    categoryId: string | null | undefined,
): AttendeeCategory | null {
    if (!categoryId) {
        return null;
    }

    return categories.find((category) => category.id === categoryId) ?? null;
}

export function buildGuestRsvpSummary(params: {
    rsvpStatus: "yes" | "no" | "maybe" | null;
    categories: AttendeeCategory[];
    additionalGuests: AdditionalGuestRowLike[];
    additionalGuestCount?: number | null;
    contributionAmount?: number | null;
}): GuestRsvpSummary | null {
    if (params.rsvpStatus !== "yes") {
        return null;
    }

    const categories = params.categories;
    const storedAdditionalGuestCount = Math.max(
        0,
        params.additionalGuestCount ?? 0,
    );
    const resolvedAdditionalGuestCount = Math.max(
        storedAdditionalGuestCount,
        params.additionalGuests.length,
    );
    const uncategorizedAdditionalGuests =
        resolvedAdditionalGuestCount - params.additionalGuests.length;
    const totalAttendees = 1 + resolvedAdditionalGuestCount;

    if (categories.length === 0) {
        const contributionAmount = params.contributionAmount ?? 0;
        const categoryBreakdown =
            contributionAmount > 0
                ? [
                      {
                          id: "guests",
                          label: "Guests",
                          count: totalAttendees,
                          contributionAmount,
                          subtotalAmount: contributionAmount * totalAttendees,
                      },
                  ]
                : [];

        return {
            totalAttendees,
            primaryGuestCategoryLabel: null,
            categoryBreakdown,
            totalContribution: categoryBreakdown.reduce(
                (sum, line) => sum + line.subtotalAmount,
                0,
            ),
        };
    }

    const summaryMap = new Map<string, GuestRsvpSummaryLine>();
    const primaryCategory = getPrimaryAttendeeCategory(categories);

    const upsertLine = (id: string, label: string, amount: number) => {
        const existing = summaryMap.get(id);
        if (existing) {
            existing.count += 1;
            existing.subtotalAmount += amount;
            return;
        }

        summaryMap.set(id, {
            id,
            label,
            count: 1,
            contributionAmount: amount,
            subtotalAmount: amount,
        });
    };

    if (primaryCategory) {
        upsertLine(
            primaryCategory.id,
            primaryCategory.label,
            primaryCategory.contributionAmount,
        );
    }

    for (const guest of params.additionalGuests) {
        const matchingCategory = getAttendeeCategoryById(categories, guest.categoryId);
        const lineId = matchingCategory?.id ?? guest.categoryId ?? guest.categoryLabel ?? "uncategorized";
        const lineLabel = matchingCategory?.label ?? guest.categoryLabel ?? "Uncategorized";
        const amount = matchingCategory?.contributionAmount ?? 0;
        upsertLine(lineId, lineLabel, amount);
    }

    for (let i = 0; i < uncategorizedAdditionalGuests; i += 1) {
        upsertLine("uncategorized", "Uncategorized", 0);
    }

    const categoryIndexMap = new Map(categories.map((cat, idx) => [cat.id, idx]));
    const categoryBreakdown = Array.from(summaryMap.values()).sort((a, b) => {
        const aIdx = categoryIndexMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bIdx = categoryIndexMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aIdx - bIdx;
    });

    return {
        totalAttendees,
        primaryGuestCategoryLabel: primaryCategory?.label ?? null,
        categoryBreakdown,
        totalContribution: categoryBreakdown.reduce(
            (sum, line) => sum + line.subtotalAmount,
            0,
        ),
    };
}

type ParseResult<T> = { value: T | null | undefined; error?: string };

export function parseCustomQuestions(
  raw: FormDataEntryValue | null,
): ParseResult<CustomRsvpQuestion[]> {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { value: undefined };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { value: undefined, error: "Invalid custom questions format" };
    }
    if (parsed.length > MAX_CUSTOM_RSVP_QUESTIONS) {
      return { value: undefined, error: `You can add up to ${MAX_CUSTOM_RSVP_QUESTIONS} custom questions` };
    }

    const normalized = normalizeCustomQuestions(parsed);
    if (normalized.length !== parsed.length) {
      return { value: undefined, error: "Invalid custom questions format" };
    }

    for (const question of normalized) {
      const type = question.type ?? "text";
      if (!QUESTION_TYPES.includes(type)) {
        return { value: undefined, error: "Invalid custom question type" };
      }
      if (type === "select" || type === "multiselect") {
        if (!question.options || question.options.length === 0) {
          return { value: undefined, error: "Select and multiple choice questions need at least one option" };
        }
        if (question.options.length > MAX_CUSTOM_QUESTION_OPTIONS) {
          return { value: undefined, error: `Questions can include up to ${MAX_CUSTOM_QUESTION_OPTIONS} options` };
        }
      }
    }

    return { value: normalized.length > 0 ? normalized : null };
  } catch {
    return { value: undefined, error: "Invalid custom questions data" };
  }
}

export function parseAttendeeCategories(
  raw: FormDataEntryValue | null,
): ParseResult<AttendeeCategory[]> {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { value: undefined };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { value: undefined, error: "Invalid attendee categories format" };
    }
    if (parsed.length > MAX_ATTENDEE_CATEGORIES) {
      return { value: undefined, error: `You can add up to ${MAX_ATTENDEE_CATEGORIES} attendee categories` };
    }

    const normalized = normalizeAttendeeCategories(parsed);
    if (normalized.length !== parsed.length) {
      return { value: undefined, error: "Invalid attendee categories format" };
    }

    return { value: normalized.length > 0 ? normalized : null };
  } catch {
    return { value: undefined, error: "Invalid attendee categories data" };
  }
}
