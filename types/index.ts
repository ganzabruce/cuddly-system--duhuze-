export type {
  User,
  Event,
  EventSettings,
  Guest,
  Attendee,
  NewUser,
  NewEvent,
  NewEventSettings,
  NewGuest,
  NewAttendee,
  EventWithSettings,
  EventWithGuests,
  EventComplete,
} from "./database";

export type {
  Guest as GuestExtended,
  AllGuestsClientProps,
  GuestStats,
  GuestFilters,
  GuestManagementFilters,
  GuestUpdatePayload,
} from "./guests";

export type {
  EventStats,
  EventStatus,
  CustomRsvpQuestion,
  AttendeeCategory,
} from "./events";

export type { ActionResult, DeleteResult } from "./result";

export type RSVPStatus = "yes" | "no" | "maybe" | null;

export type EventVisibility = "public" | "private" | "unlisted";

export type EventFormData = {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  guestCapacity?: number;
  rsvpDeadline?: Date;
  requireApproval?: boolean;
  visibility?: EventVisibility;
};

export type GuestFormData = {
  name: string;
  email: string;
};

export type RSVPFormData = {
  status: "yes" | "no" | "maybe";
  note?: string;
  plusOnes?: number;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type EventFilters = {
  search?: string;
  visibility?: EventVisibility;
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: number;
};

export type SortOrder = "asc" | "desc";

export type SortParams = {
  field: string;
  order: SortOrder;
};
