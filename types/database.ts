import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
    users,
    events,
    eventSettings,
    guests,
    attendees,
} from "@/lib/db/schema";

// Select types (for reading from database)
export type User = InferSelectModel<typeof users>;
export type Event = InferSelectModel<typeof events>;
export type EventSettings = InferSelectModel<typeof eventSettings>;
export type Guest = InferSelectModel<typeof guests>;
export type Attendee = InferSelectModel<typeof attendees>;

// Insert types (for writing to database)
export type NewUser = InferInsertModel<typeof users>;
export type NewEvent = InferInsertModel<typeof events>;
export type NewEventSettings = InferInsertModel<typeof eventSettings>;
export type NewGuest = InferInsertModel<typeof guests>;
export type NewAttendee = InferInsertModel<typeof attendees>;

// Extended types with relations
export type EventWithSettings = Event & {
    settings?: EventSettings | null;
};

export type EventWithGuests = Event & {
    guests?: Guest[];
    settings?: EventSettings | null;
};

export type EventComplete = Event & {
    settings?: EventSettings | null;
    guests?: Guest[];
    creator?: User | null;
};
