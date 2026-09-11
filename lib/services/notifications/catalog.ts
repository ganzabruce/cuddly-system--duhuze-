import type { NotificationDefinition, NotificationType } from "@/types/notifications";
import { dashboardEventGuestsLink, dashboardEventLink } from "./links";

const titleOrFallback = (title: string | null | undefined): string =>
  title?.trim() || "your event";

export const notificationCatalog: Record<NotificationType, NotificationDefinition> = {
  event_created: {
    channels: ["in_app", "push"],
    buildContent: (context) => ({
      title: "Event created",
      body: `${titleOrFallback(context.eventTitle)} is now in your dashboard.`,
      link: context.link ?? dashboardEventLink(context.eventSlug),
      payload: { eventId: context.eventId ?? null },
    }),
  },
  event_updated: {
    channels: ["in_app", "push"],
    buildContent: (context) => {
      const changeSummary = Array.isArray(context.changes) && context.changes.length > 0
        ? context.changes.join(", ")
        : "details updated";

      return {
        title: "Event updated",
        body: `${titleOrFallback(context.eventTitle)} was updated (${changeSummary}).`,
        link: context.link ?? dashboardEventLink(context.eventSlug),
        payload: { eventId: context.eventId ?? null, changes: context.changes ?? [] },
      };
    },
  },
  guest_added: {
    channels: ["in_app", "push"],
    buildContent: (context) => ({
      title: "Guest added",
      body: `${context.guestName?.trim() || "A guest"} was added to ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: { eventId: context.eventId ?? null, guestId: context.guestId ?? null },
    }),
  },
  guests_imported: {
    channels: ["in_app", "push"],
    buildContent: (context) => ({
      title: "Guests imported",
      body: `${context.count ?? 0} guests were imported into ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: { eventId: context.eventId ?? null, count: context.count ?? 0 },
    }),
  },
  invitations_sent: {
    channels: ["in_app", "push"],
    buildContent: (context) => ({
      title: "Invitations sent",
      body: `${context.count ?? 0} invitation emails were sent for ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: { eventId: context.eventId ?? null, count: context.count ?? 0 },
    }),
  },
  reminders_sent: {
    channels: ["in_app", "push"],
    buildContent: (context) => ({
      title: "Reminders sent",
      body: `${context.count ?? 0} reminder emails were sent for ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: { eventId: context.eventId ?? null, count: context.count ?? 0 },
    }),
  },
  rsvp_received: {
    channels: ["in_app", "email", "push", "whatsapp"],
    buildContent: (context) => ({
      title: "New RSVP received",
      body: `${context.guestName?.trim() || "A guest"} responded ${String(context.rsvpStatus ?? "pending").toUpperCase()} for ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: {
        eventId: context.eventId ?? null,
        guestId: context.guestId ?? null,
        rsvpStatus: context.rsvpStatus ?? null,
      },
    }),
  },
  rsvp_updated: {
    channels: ["in_app", "email", "push", "whatsapp"],
    buildContent: (context) => ({
      title: "RSVP updated",
      body: `${context.guestName?.trim() || "A guest"} updated RSVP to ${String(context.rsvpStatus ?? "pending").toUpperCase()} for ${titleOrFallback(context.eventTitle)}.`,
      link: context.link ?? dashboardEventGuestsLink(context.eventSlug),
      payload: {
        eventId: context.eventId ?? null,
        guestId: context.guestId ?? null,
        rsvpStatus: context.rsvpStatus ?? null,
      },
    }),
  },
};
