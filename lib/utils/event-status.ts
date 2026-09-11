import type { EventStatus } from "@/types/events";

export type EventWithStatusAndDates = {
  status: EventStatus | null;
  date: Date;
  endDate: Date | null;
};

export function getEventEndedAt(event: EventWithStatusAndDates): Date {
  return event.endDate ?? event.date;
}

export function normalizeEventStatus<T extends EventWithStatusAndDates>(
  event: T,
  now: Date = new Date(),
): T {
  const eventEndedAt = getEventEndedAt(event);
  if (event.status !== "cancelled" && eventEndedAt < now) {
    return { ...event, status: "completed" };
  }
  return event;
}

export function normalizeStatusValue(
  status: EventStatus | null | undefined,
  eventEndedAt: Date,
  now: Date = new Date(),
): EventStatus {
  if (!status) return status ?? "draft";
  if (status !== "cancelled" && eventEndedAt < now) {
    return "completed";
  }
  return status;
}
