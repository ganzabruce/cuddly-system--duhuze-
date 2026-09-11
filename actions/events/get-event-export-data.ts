"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { events, eventSettings, guests, rsvpAdditionalGuests } from "@/lib/db/schema";
import { verifyEventOwnership } from "@/actions/events/verify-ownership";
import { normalizeCustomQuestions, normalizeCustomQuestionResponses } from "@/lib/constants/events/rsvp-config";
import type {
  EventExport,
  GuestExportRow,
  AdditionalGuestRow,
} from "@/types/guests";

export async function getEventExportData(
  eventId: number,
  userId: number,
): Promise<EventExport> {
  await verifyEventOwnership(eventId, userId);

  const [eventRows, settingsRows, rawGuests] = await Promise.all([
    db
      .select({
        title: events.title,
        date: events.date,
        timezone: events.timezone,
        locationName: events.locationName,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1),
    db
      .select({
        guestCapacity: eventSettings.guestCapacity,
        customQuestions: eventSettings.customQuestions,
      })
      .from(eventSettings)
      .where(eq(eventSettings.eventId, eventId))
      .limit(1),
    db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        phoneNumber: guests.phoneNumber,
        rsvpStatus: guests.rsvpStatus,
        additionalGuestCount: guests.additionalGuestCount,
        customQuestionResponses: guests.customQuestionResponses,
        attendanceStatus: guests.attendanceStatus,
        invitationSent: guests.invitationSent,
        invitationSentAt: guests.invitationSentAt,
        invitationOpened: guests.invitationOpened,
        respondedAt: guests.respondedAt,
        rsvpNote: guests.rsvpNote,
      })
      .from(guests)
      .where(eq(guests.eventId, eventId)),
  ]);

  const event = eventRows[0];
  const settings = settingsRows[0];

  if (!event) {
    throw new Error("Event not found");
  }

  const customQuestions = normalizeCustomQuestions(settings?.customQuestions);

  const rawAdditionalGuests = rawGuests.length > 0
    ? await db
        .select({
          guestId: rsvpAdditionalGuests.guestId,
          name: rsvpAdditionalGuests.name,
          email: rsvpAdditionalGuests.email,
          categoryLabel: rsvpAdditionalGuests.categoryLabel,
          sortOrder: rsvpAdditionalGuests.sortOrder,
        })
        .from(rsvpAdditionalGuests)
        .where(eq(rsvpAdditionalGuests.eventId, eventId))
    : [];

  const additionalByGuest = new Map<number, typeof rawAdditionalGuests>();
  for (const ag of rawAdditionalGuests) {
    const list = additionalByGuest.get(ag.guestId) ?? [];
    list.push(ag);
    additionalByGuest.set(ag.guestId, list);
  }

  let yesCount = 0;
  let noCount = 0;
  let maybeCount = 0;
  let pendingCount = 0;
  let totalSeatsUsed = 0;
  let invitationsSent = 0;
  let invitationsOpened = 0;

  const guestRows: GuestExportRow[] = [];
  const additionalGuestRows: AdditionalGuestRow[] = [];

  for (const guest of rawGuests) {
    const status = guest.rsvpStatus ?? null;
    if (status === "yes") {
      yesCount++;
      totalSeatsUsed += 1 + (guest.additionalGuestCount ?? 0);
    } else if (status === "no") {
      noCount++;
    } else if (status === "maybe") {
      maybeCount++;
    } else {
      pendingCount++;
    }

    if (guest.invitationSent) invitationsSent++;
    if (guest.invitationOpened) invitationsOpened++;

    const guestAdditional = additionalByGuest.get(guest.id) ?? [];
    const additionalNames = guestAdditional
      .map((ag) => ag.name)
      .filter(Boolean)
      .join(", ");

    guestRows.push({
      name: guest.name,
      email: guest.email,
      phoneNumber: guest.phoneNumber ?? null,
      rsvpStatus: status,
      additionalGuestCount: guest.additionalGuestCount ?? 0,
      additionalGuestNames: additionalNames,
      attendanceStatus: guest.attendanceStatus,
      invitationSent: guest.invitationSent,
      invitationSentAt: guest.invitationSentAt,
      invitationOpened: guest.invitationOpened,
      respondedAt: guest.respondedAt,
      rsvpNote: guest.rsvpNote ?? null,
      customQuestionResponses: normalizeCustomQuestionResponses(
        guest.customQuestionResponses,
      ),
    });

    for (const ag of guestAdditional) {
      additionalGuestRows.push({
        parentGuestName: guest.name,
        name: ag.name,
        email: ag.email,
        categoryLabel: ag.categoryLabel,
        sortOrder: ag.sortOrder,
      });
    }
  }

  const totalGuests = totalSeatsUsed;
  const totalInvitations = rawGuests.length;
  const responded = yesCount + noCount + maybeCount;
  const responseRate = totalInvitations === 0
    ? 0
    : Math.round((responded / totalInvitations) * 10000) / 100;
  const openRate = invitationsSent === 0
    ? 0
    : Math.round((invitationsOpened / invitationsSent) * 10000) / 100;

  return {
    eventSummary: {
      title: event.title,
      date: event.date,
      timezone: event.timezone ?? undefined,
      locationName: event.locationName,
      guestCapacity: settings?.guestCapacity ?? null,
      totalGuests,
      yesCount,
      noCount,
      maybeCount,
      pendingCount,
      responseRate,
      invitationsSent,
      invitationsOpened,
      openRate,
    },
    guests: guestRows,
    additionalGuests: additionalGuestRows,
    customQuestions: customQuestions.map((q) => ({ id: q.id, label: q.label })),
  };
}
