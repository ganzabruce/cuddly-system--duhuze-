import type { DeleteResult as BaseDeleteResult } from "@/types/result";
import type { Activity } from "@/types/activities";
import type { EventAnalyticsRow } from "@/types/analytics";

export type ImageFormat = "square" | "portrait" | "tall" | "landscape";

/** A minimal upcoming-event tile for the dashboard overview. */
export type UpcomingEvent = {
  id: number;
  title: string | null;
  date: Date | string | null;
  slug: string | null;
};

/** Aggregated data for the dashboard overview page. */
export type OverviewData = {
  displayName: string;
  isNewUser: boolean;
  upcomingCount: number;
  upcomingEvents: UpcomingEvent[];
  activities: Activity[];
  allEvents: EventAnalyticsRow[];
};

/** Seat-usage snapshot for an event's capacity checks. */
export type EventCapacity = {
  guestCapacity: number | null;
  /** Total seats used = sum of (1 + additional_guest_count) for each "yes" guest */
  totalSeatsUsed: number;
  atCapacity: boolean;
};

export type QuestionType =
  | "text"
  | "textarea"
  | "yesno"
  | "select"
  | "multiselect";

export type ContributionCollectionMode = "offline" | "platform" | "optional";
export type EventPaymentMethod = "mobile_money";

export type EventStats = {
  total: number;
  upcoming: number;
  past: number;
};

export type CustomRsvpQuestion = {
  id: string;
  label: string;
  required: boolean;
  type?: QuestionType;
  options?: string[];
};

export type AttendeeCategory = {
  id: string;
  label: string;
  contributionAmount: number;
  sortOrder: number;
};

export type GuestRsvpSummaryLine = {
  id: string;
  label: string;
  count: number;
  contributionAmount: number;
  subtotalAmount: number;
};

export type GuestRsvpSummary = {
  totalAttendees: number;
  primaryGuestCategoryLabel: string | null;
  categoryBreakdown: GuestRsvpSummaryLine[];
  totalContribution: number;
};

export type AdditionalGuestDraft = {
  name: string;
  categoryId: string;
  email?: string | null;
};

export type PaymentBreakdownLine = {
  label: string;
  count: number;
  contributionAmount: number;
  subtotalAmount: number;
};

export type EventDeleteResult = BaseDeleteResult<number> & {
  eventId: number;
};

export type EventDesignTemplateId =
  | "minimal-light"
  | "minimal-dark"
  | "elegant-light"
  | "elegant-dark"
  | "floral-light"
  | "floral-dark"
  | "modern-light"
  | "modern-dark";

export type EventDesignFontFamily =
  | "inter"
  | "playfair"
  | "roboto"
  | "opensans"
  | "lato"
  | "montserrat";

export type EventDesignLayout = "centered" | "left" | "split";

export type EventDesignFontSize = {
  name: string;
  size: number;
};

export type EventDesignFontSizes = {
  eventTitle: number;
  eventDate: number;
  eventTime: number;
  eventLocation: number;
  guestName: number;
  guestTable: number;
  additionalText: number;
};

export type EventDesignColors = {
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
};

export type EventDesignTypography = {
  fontFamily: EventDesignFontFamily;
  fontSizes: EventDesignFontSizes;
};

export type EventDesignCustomizations = {
  templateId: EventDesignTemplateId | null;
  layout: EventDesignLayout;
  typography: EventDesignTypography;
  colors: EventDesignColors;
  hideAdditionalGuests: boolean;
  customLabelAdditionalGuests: string;
  showQrOnDesign: boolean;
};

export type RsvpAccessMode = "public" | "unlisted" | "private";

export type GuestStatus = "active" | "pending_approval" | "waitlisted" | "rejected";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type EventPublishResult =
  | { success: true; data: { message: string } }
  | { success: false; error: string };

export type EventDetail = {
  event: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    startDate: string;
    startTime: string | null;
    endTime: string | null;
    timezone: string;
    venue: string | null;
    address: string | null;
    coverImageUrl: string | null;
    status: EventStatus;
    allowAdditionalGuests: boolean;
    maxAdditionalGuests: number;
    enableContributions: boolean;
    contributionAmount: number | null;
    contributionCurrency: string;
    contributionMode: "per_event" | "per_person";
    attendeeCategories: unknown[];
    customQuestions: unknown[];
    isPrivate: boolean;
    requireApproval: boolean;
    accessMode: RsvpAccessMode | null;
    eventDesignCustomizations: EventDesignCustomizations | null;
    organizer: {
      id: number;
      displayName: string | null;
      email: string | null;
      profileImageUrl: string | null;
      organizationName: string | null;
      phoneNumber: string | null;
    } | null;
  };
  settings: {
    id: number;
    eventId: number;
    customUrl: string | null;
    allowAdditionalGuests: boolean;
    maxAdditionalGuests: number;
    additionalGuestLabel: string | null;
    requireApproval: boolean;
    accessMode: RsvpAccessMode;
    enableContributions: boolean;
    contributionMode: "per_event" | "per_person";
    contributionAmount: number | null;
    contributionCurrency: string;
    attendeeCategories: unknown[];
    customQuestions: unknown[];
    eventDesignCustomizations: EventDesignCustomizations | null;
  } | null;
  stats: {
    yes: number;
    no: number;
    maybe: number;
    pending: number;
    total: number;
    paid: number;
    unpaid: number;
    totalContribution: number;
    totalCapacity: number | null;
    percentageFilled: number | null;
  };
  userRsvp: {
    id: number;
    status: "yes" | "no" | "maybe" | "pending";
    submittedAt: string;
    paymentStatus: "unpaid" | "paid" | "partial" | "refunded" | null;
  } | null;
};

export type DashboardEvent = {
  id: number;
  title: string;
  description: string | null;
  category?: string | null;
  date: Date | string;
  endDate: Date | string | null;
  timezone: string;
  locationType: "online" | "in_person";
  locationName: string;
  locationLink: string | null;
  image: string | null;
  imageFormat?: ImageFormat;
  slug: string;
  visibility: string;
  status: "draft" | "published" | "completed" | "cancelled";
  guestCapacity?: number | null;
  contributionRequired?: boolean;
  contributionCollectionMode?: "offline" | "platform" | "optional";
  contributionAmount?: number | null;
  contributionPaymentInfo?: string | null;
  totalCollected?: number;
  availableBalance?: number;
  totalWithdrawals?: number;
  rsvpAccessMode?: "open_rsvp" | "invite_only";
  requireApproval?: boolean;
  allowAdditionalGuests?: boolean;
  maxAdditionalGuests?: number | null;
  customQuestions?: CustomRsvpQuestion[];
  attendeeCategories?: AttendeeCategory[];
  currency?: string | null;
  whatsappEnabled?: boolean;
};

export type DashboardGuest = {
  id: number;
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
  whatsappInvitationSent?: boolean;
  createdAt: Date | string | null;
};
