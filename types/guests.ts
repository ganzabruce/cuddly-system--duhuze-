import { z } from "zod";
import type { events, guests } from "@/lib/db/schema";
import type { DeleteResult as BaseDeleteResult } from "@/types";
import type {
  AttendeeCategory,
  CustomRsvpQuestion,
  GuestRsvpSummary,
  GuestRsvpSummaryLine,
} from "@/types/events";

export interface DeleteResult extends BaseDeleteResult<number> {
  guestId: number;
}

export interface BulkDeleteResult {
  success: boolean;
  deleted: number;
}

export interface BulkCreateResult {
  created: Array<{
    id: number;
    eventId: number;
    name: string;
    email: string | null;
    rsvpStatus: "yes" | "no" | "maybe" | null;
    rsvpNote: string | null;
    respondedAt: Date | null;
    invitationSent: boolean;
    invitationSentAt: Date | null;
    invitationOpened: boolean;
    invitationOpenedAt: Date | null;
    createdAt: Date | null;
  }>;
  skipped: number;
  total: number;
}

export const createGuestSchema = z.object({
  eventId: z.number().int().positive("Valid event ID is required"),
  name: z.string().min(1, "Guest name is required").max(255),
  email: z.string().email().max(255).optional().nullable(),
  phoneNumber: z.string().max(50).optional().nullable(),
  rsvpStatus: z.enum(["yes", "no", "maybe"]).optional().nullable(),
  rsvpNote: z.string().max(1000).optional().nullable(),
  additionalGuestCount: z.number().int().min(0).optional().default(0),
});

export const updateGuestSchema = createGuestSchema.partial().omit({ eventId: true });

export const bulkCreateGuestSchema = z.object({
  eventId: z.number().int().positive(),
  source: z.enum(["manual", "csv_import"]).optional().default("manual"),
  guests: z.array(z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().max(255).optional().nullable(),
    phoneNumber: z.string().max(50).optional().nullable(),
    rsvpStatus: z.enum(["yes", "no", "maybe"]).optional().nullable(),
  })).min(1).max(100),
});

export type CreateGuestData = z.infer<typeof createGuestSchema>;
export type UpdateGuestData = z.infer<typeof updateGuestSchema>;
export type BulkCreateGuestData = z.infer<typeof bulkCreateGuestSchema>;

export type EventSummary = {
  id: number;
  title: string;
  slug: string;
  date: Date | string;
};

export type Guest = {
  id: number;
  eventId?: number;
  name: string;
  email: string | null;
  phoneNumber?: string | null;
  rsvpStatus: "yes" | "no" | "maybe" | null;
  rsvpNote: string | null;
  additionalGuestCount?: number;
  customQuestionResponses?: Record<string, string> | null;
  respondedAt: Date | string | null;
  invitationSent: boolean;
  invitationOpened: boolean;
  invitationSentAt?: Date | string | null;
  invitationOpenedAt?: Date | string | null;
  reminderSentAt?: Date | string | null;
  whatsappInvitationSent?: boolean;
  whatsappInvitationSentAt?: Date | string | null;
  inviteToken?: string | null;
  inviteTokenState?: "pending" | "used" | "expired" | "revoked";
  inviteTokenExpiresAt?: Date | string | null;
  inviteTokenUsedAt?: Date | string | null;
  guestToken?: string | null;
  confirmationToken?: string | null;
  createdAt: Date | string | null;
  publicUrl?: string | null;
  eventTitle?: string;
  eventSlug?: string;
  eventDate?: Date | string;
  additionalGuests?: AdditionalGuestContact[];
  customQuestions?: CustomRsvpQuestion[];
  attendeeCategories?: AttendeeCategory[];
  currency?: string | null;
  rsvpSummary?: GuestRsvpSummary | null;
};

export type AdditionalGuestContact = {
  id?: number;
  name: string | null;
  email: string | null;
  categoryId?: string | null;
  categoryLabel?: string | null;
  sortOrder: number;
};

export type { GuestRsvpSummary, GuestRsvpSummaryLine };

export type AllGuestsClientProps = {
  guests: Guest[];
  events: EventSummary[];
  hour12?: boolean;
};

export type GuestStats = {
  total: number;
  yes: number;
  no: number;
  maybe: number;
  pending: number;
  totalEvents?: number;
};

export type GuestFilters = {
  searchTerm: string;
  statusFilter: Guest["rsvpStatus"] | "pending" | "all";
  eventFilter: "all" | string;
};

export type GuestUpdatePayload = {
  rsvpStatus?: Guest["rsvpStatus"];
  rsvpNote?: string | null;
  invitationSent?: boolean;
  invitationOpened?: boolean;
};

export type GuestManagementFilters = {
  search?: string;
  rsvpStatus?: "all" | "yes" | "no" | "maybe" | "pending";
  checkInStatus?: "all" | "checked_in" | "not_checked_in";
  paymentStatus?: "all" | "paid" | "unpaid" | "partial";
  page?: number;
  pageSize?: number;
};

export type GuestCardThemeProps = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  rsvpStatus: string | null;
  additionalGuests: number;
  checkInTime: string | null;
  paymentStatus: string | null;
  registeredAt: string | Date;
  onEdit?: () => void;
  onDelete?: () => void;
  onCheckIn?: () => void;
  onViewDetails?: () => void;
  isCheckingIn?: boolean;
  canCheckIn?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type GuestDetailsDialogProps = {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type GuestListProps = {
  guests: Guest[];
  eventName?: string;
  eventId: number;
  eventSlug?: string | null;
  eventPublicUrl?: string | null;
  hour12?: boolean;
  featureAccess: import("@/lib/constants/billing/feature-access").BillingFeatureAccess;
  whatsappEnabled?: boolean;
};

/** A guest joined with its event, resolved from a guest RSVP token. */
export type GuestWithEvent = {
  guest: typeof guests.$inferSelect;
  event: typeof events.$inferSelect;
};

/** Event-level summary rendered on the first sheet of a guest export. */
export type EventExportSummary = {
  title: string;
  date: Date | string;
  timezone?: string;
  locationName: string;
  guestCapacity: number | null;
  totalGuests: number;
  yesCount: number;
  noCount: number;
  maybeCount: number;
  pendingCount: number;
  responseRate: number;
  invitationsSent: number;
  invitationsOpened: number;
  openRate: number;
};

/** One guest row in a CSV/Excel export. */
export type GuestExportRow = {
  name: string;
  email: string | null;
  phoneNumber: string | null;
  rsvpStatus: "yes" | "no" | "maybe" | null;
  additionalGuestCount: number;
  additionalGuestNames: string;
  attendanceStatus: string;
  invitationSent: boolean;
  invitationSentAt: Date | string | null;
  invitationOpened: boolean;
  respondedAt: Date | string | null;
  rsvpNote: string | null;
  customQuestionResponses: Record<string, string> | null;
};

/** One additional ("plus-one") guest row in an export. */
export type AdditionalGuestRow = {
  parentGuestName: string;
  name: string | null;
  email: string | null;
  categoryLabel: string | null;
  sortOrder: number;
};

/** Full payload for exporting an event's guest list. */
export type EventExport = {
  eventSummary: EventExportSummary;
  guests: GuestExportRow[];
  additionalGuests: AdditionalGuestRow[];
  customQuestions: { id: string; label: string }[];
};
