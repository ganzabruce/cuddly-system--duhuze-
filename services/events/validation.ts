import { z } from "zod";
import { EVENT_CATEGORY_VALUES } from "@/lib/constants/events/constants";
import { getSafeExternalHref } from "@/lib/utils/url";
import {
  MAX_ADDITIONAL_GUESTS_PER_RSVP,
  MAX_ATTENDEE_CATEGORIES,
  MAX_CUSTOM_QUESTION_OPTIONS,
  MAX_CUSTOM_RSVP_QUESTIONS,
} from "@/lib/constants/events/rsvp-limits";

const eventStatusSchema = z.enum(["draft", "published", "completed", "cancelled"]);
const questionTypeSchema = z.enum([
  "text",
  "textarea",
  "yesno",
  "select",
  "multiselect",
]);
const customQuestionSchema = z
  .object({
    id: z.string(),
    label: z.string().max(500),
    required: z.boolean(),
    type: questionTypeSchema.optional(),
    options: z.array(z.string().min(1).max(200)).max(MAX_CUSTOM_QUESTION_OPTIONS).optional(),
  })
  .superRefine((value, ctx) => {
    const type = value.type ?? "text";
    const needsOptions = type === "select" || type === "multiselect";
    if (needsOptions) {
      if (!value.options || value.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Options are required for select and multiple choice questions",
          path: ["options"],
        });
      }
    }
  });
const attendeeCategorySchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  contributionAmount: z
    .number()
    .int("Amount must be a whole number")
    .min(0, "Amount must be at least 0")
    .max(100000000, "Amount is too large"),
  sortOrder: z.number().int().min(0).max(MAX_ATTENDEE_CATEGORIES - 1),
});

// Base object schema without refinements so .partial() can be used for updates
const baseEventSchema = z.object({
  title: z
    .string()
    .min(1, "Event title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  category: z.enum(EVENT_CATEGORY_VALUES).optional().nullable(),
  date: z
    .string()
    .min(1, "Event date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  endDate: z.string().optional().nullable(),
  timezone: z.string().min(1).max(100).optional(),
  locationType: z.enum(["online", "in_person"]).optional(),
  locationName: z.string().max(255).optional().nullable(),
  visibility: z.enum(["public", "private"]).optional(),
  status: eventStatusSchema.optional(),

  locationLink: z
    .string()
    .trim()
    .max(255, "Location must be less than 255 characters")
    .refine(
      (value) => !value || getSafeExternalHref(value) !== null,
      "Location must be a valid http(s) URL",
    )
    .optional(),
  image: z.string().url("Invalid image URL").optional(),
  imageFormat: z.enum(["square", "portrait", "tall", "landscape"]).optional(),
  maxCapacity: z
    .number()
    .int("Must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity cannot exceed 10000")
    .optional()
    .nullable(),
  contributionCollectionMode: z.enum(["offline", "platform", "optional"]).optional(),
  contributionAmount: z
    .number()
    .int("Amount must be a whole number")
    .min(0, "Amount must be at least 0")
    .max(100000000, "Amount is too large")
    .optional()
    .nullable(),
  contributionPaymentInfo: z
    .string()
    .max(2000, "Payment info must be less than 2000 characters")
    .optional()
    .nullable(),
  customQuestions: z
    .array(customQuestionSchema)
    .max(
      MAX_CUSTOM_RSVP_QUESTIONS,
      `You can add up to ${MAX_CUSTOM_RSVP_QUESTIONS} custom questions`,
    )
    .optional()
    .nullable(),
  attendeeCategories: z
    .array(attendeeCategorySchema)
    .max(
      MAX_ATTENDEE_CATEGORIES,
      `You can add up to ${MAX_ATTENDEE_CATEGORIES} attendee categories`,
    )
    .optional()
    .nullable(),
  rsvpAccessMode: z.enum(["open_rsvp", "invite_only"]).optional(),
  requireApproval: z.boolean().optional(),
  allowAdditionalGuests: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  maxAdditionalGuests: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(
      MAX_ADDITIONAL_GUESTS_PER_RSVP,
      `Cannot exceed ${MAX_ADDITIONAL_GUESTS_PER_RSVP}`,
    )
    .optional()
    .nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code").optional(),
  slug: z
    .string()
    .min(1, "Event link is required")
    .max(255, "Event link must be less than 255 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Event link can only contain lowercase letters, numbers, and dashes",
    )
    .optional(),
});

export const createEventSchema = baseEventSchema
  .extend({
    status: eventStatusSchema.default("published"),
  })
  .superRefine((data, ctx) => {
    const eventDate = new Date(data.date);
    if (eventDate < new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event date/time cannot be in the past",
        path: ["date"],
      });
    }


    const hasCategoryPricing =
      data.attendeeCategories?.some((category) => category.contributionAmount > 0) ??
      false;

    if (data.contributionCollectionMode === "platform") {
      if (!hasCategoryPricing && (data.contributionAmount == null || data.contributionAmount <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Contribution amount is required",
          path: ["contributionAmount"],
        });
      }
    }

    if (
      data.contributionCollectionMode === "offline" &&
      (hasCategoryPricing || (data.contributionAmount ?? 0) > 0) &&
      (!data.contributionPaymentInfo || data.contributionPaymentInfo.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payment instructions are required",
        path: ["contributionPaymentInfo"],
      });
    }

    if (!data.locationType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a location type",
        path: ["locationType"],
      });
    }

    if (data.locationType === "in_person") {
      if (!data.locationName || data.locationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Venue or place name is required for in-person events",
          path: ["locationName"],
        });
      }
    }

    if (data.locationType === "online" && data.locationName !== "Online") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Online events must use the standard location name",
        path: ["locationName"],
      });
    }
  });

export const updateEventSchema = baseEventSchema.partial();

// Type exports
export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;
