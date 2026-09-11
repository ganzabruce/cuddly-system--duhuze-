"use server";


import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import db from "@/lib/db";
import { eventSettings, events, guests, eventPayments, eventWithdrawals } from "@/lib/db/schema";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { getUserEvents } from "@/actions/events/get-events";
import { getOverviewData } from "@/actions/events/overview/get-overview-data";
import { getAnalyticsData } from "@/actions/events/analytics/get-analytics-data";
import { getUserSettings } from "@/lib/services/auth/user-settings";
import { getEventFeatureAccess, getResolvedEntitlements } from "@/lib/services/billing/entitlements";
import { getEventEndedAt, normalizeStatusValue } from "@/lib/utils/event-status";
import {
  normalizeAttendeeCategories,
  normalizeCustomQuestions,
  normalizeCustomQuestionResponses,
} from "@/lib/constants/events/rsvp-config";
import logger from "@/lib/utils/logger";
export async function getDashboardEventTitle(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [event] = await db
    .select({ title: events.title })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.createdBy, user.id)))
    .limit(1);

  return event?.title ?? null;
}

export async function getDashboardOverviewData() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getOverviewData(user.id);
  if (!data) redirect("/login");

  return {
    ...data,
    upcomingEvents: data.upcomingEvents.map((e) => ({
      ...e,
      date: e.date ? new Date(e.date).toISOString() : null,
    })),
    allEvents: data.allEvents.map((e) => ({
      ...e,
      date: new Date(e.date).toISOString(),
    })),
  };
}

export async function getDashboardAnalyticsData(range: {
  startDate?: string;
  endDate?: string;
} = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getAnalyticsData(user.id, {
    startDate: range.startDate ? new Date(range.startDate) : undefined,
    endDate: range.endDate ? new Date(range.endDate) : undefined,
  });
  if (!data) redirect("/login");

  return {
    ...data,
    events: data.events.map((e) => ({
      ...e,
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
    })),
  };
}

export async function getDashboardEvents() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let userEvents: Awaited<ReturnType<typeof getUserEvents>>["data"] = [];
  try {
    const result = await getUserEvents(user.id, { limit: 500 });
    userEvents = result.data;
  } catch (error) {
    logger.error("Database query error while fetching events", error);
  }

  return userEvents.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
  }));
}

export async function getDashboardEventDetail(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [userSettings, entitlements] = await Promise.all([
    getUserSettings(user.id),
    getResolvedEntitlements(user.id),
  ]);
  const featureAccess = getEventFeatureAccess(entitlements);

  const eventData = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      category: events.category,
      date: events.date,
      endDate: events.endDate,
      locationType: events.locationType,
      locationName: events.locationName,
      locationLink: events.locationLink,
      image: events.image,
      imageFormat: events.imageFormat,
      slug: events.slug,
      visibility: events.visibility,
      totalCollected: events.totalCollected,
      availableBalance: events.availableBalance,
      totalWithdrawals: events.totalWithdrawals,
      status: events.status,
      timezone: events.timezone,
    })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.createdBy, user.id)))
    .limit(1);

  if (!eventData.length) {
    notFound();
  }

  const event = eventData[0];
  const eventEndedAt = getEventEndedAt(event);
  const normalizedStatus = normalizeStatusValue(event.status, eventEndedAt);
  event.status = normalizedStatus ?? event.status;

  const [settingsRows, rawEventGuests] = await Promise.all([
    db
      .select({
        guestCapacity: eventSettings.guestCapacity,
        contributionCollectionMode: eventSettings.contributionCollectionMode,
        contributionAmount: eventSettings.contributionAmount,
        contributionPaymentInfo: eventSettings.contributionPaymentInfo,
        currency: eventSettings.currency,
        rsvpAccessMode: eventSettings.rsvpAccessMode,
        requireApproval: eventSettings.requireApproval,
        allowAdditionalGuests: eventSettings.allowAdditionalGuests,
        maxAdditionalGuests: eventSettings.maxAdditionalGuests,
        customQuestions: eventSettings.customQuestions,
        attendeeCategories: eventSettings.attendeeCategories,
        whatsappEnabled: eventSettings.whatsappEnabled,
      })
      .from(eventSettings)
      .where(eq(eventSettings.eventId, event.id))
      .limit(1),
    db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        rsvpStatus: guests.rsvpStatus,
        rsvpNote: guests.rsvpNote,
        additionalGuestCount: guests.additionalGuestCount,
        customQuestionResponses: guests.customQuestionResponses,
        respondedAt: guests.respondedAt,
        invitationSent: guests.invitationSent,
        invitationOpened: guests.invitationOpened,
        phoneNumber: guests.phoneNumber,
        whatsappInvitationSent: guests.whatsappInvitationSent,
        createdAt: guests.createdAt,
      })
      .from(guests)
      .where(eq(guests.eventId, event.id)),
  ]);

  const guestCapacity = settingsRows[0]?.guestCapacity ?? null;
  const contributionCollectionMode =
    settingsRows[0]?.contributionCollectionMode ?? "offline";
  const contributionRequired = contributionCollectionMode === "platform";
  const contributionAmount = settingsRows[0]?.contributionAmount ?? null;
  const contributionPaymentInfo = settingsRows[0]?.contributionPaymentInfo ?? null;
  const rsvpAccessMode = settingsRows[0]?.rsvpAccessMode ?? "open_rsvp";
  const currency = settingsRows[0]?.currency ?? "RWF";
  const requireApproval = settingsRows[0]?.requireApproval ?? false;
  const allowAdditionalGuests = settingsRows[0]?.allowAdditionalGuests ?? false;
  const maxAdditionalGuests = settingsRows[0]?.maxAdditionalGuests ?? null;
  const customQuestions = normalizeCustomQuestions(settingsRows[0]?.customQuestions);
  const whatsappEnabled = settingsRows[0]?.whatsappEnabled ?? false;
  const attendeeCategories = normalizeAttendeeCategories(
    settingsRows[0]?.attendeeCategories,
  );

  const eventGuests = rawEventGuests.map((guest) => ({
    ...guest,
    customQuestionResponses: normalizeCustomQuestionResponses(
      guest.customQuestionResponses,
    ),
    respondedAt: guest.respondedAt ? guest.respondedAt.toISOString() : null,
    createdAt: guest.createdAt ? guest.createdAt.toISOString() : null,
  }));

  const paymentsActive =
    featureAccess.eventContributions &&
    (contributionCollectionMode === "platform" || contributionCollectionMode === "optional");

  const [rawPayments, rawWithdrawals] = paymentsActive
    ? await Promise.all([
        db
          .select({
            id: eventPayments.id,
            amount: eventPayments.amount,
            currency: eventPayments.currency,
            status: eventPayments.status,
            payerPhone: eventPayments.payerPhone,
            payerName: eventPayments.payerName,
            createdAt: eventPayments.createdAt,
            guestName: guests.name,
            guestEmail: guests.email,
          })
          .from(eventPayments)
          .leftJoin(guests, eq(eventPayments.guestId, guests.id))
          .where(eq(eventPayments.eventId, event.id))
          .orderBy(desc(eventPayments.createdAt)),
        db
          .select({
            id: eventWithdrawals.id,
            amount: eventWithdrawals.amount,
            currency: eventWithdrawals.currency,
            status: eventWithdrawals.status,
            destinationPhone: eventWithdrawals.destinationPhone,
            timestamp: eventWithdrawals.timestamp,
          })
          .from(eventWithdrawals)
          .where(
            and(
              eq(eventWithdrawals.eventId, event.id),
              eq(eventWithdrawals.organizerId, user.id),
            ),
          )
          .orderBy(desc(eventWithdrawals.timestamp)),
      ])
    : [[], []];

  const financeSummary = paymentsActive
    ? {
        totalCollected: event.totalCollected ?? 0,
        pendingContributions: rawPayments
          .filter((p) => p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0),
        totalWithdrawn: event.totalWithdrawals ?? 0,
        availableBalance: event.availableBalance ?? 0,
      }
    : undefined;

  return {
    event: {
      ...event,
      date: event.date.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
      guestCapacity,
      contributionRequired,
      contributionCollectionMode,
      contributionAmount,
      contributionPaymentInfo,
      currency,
      rsvpAccessMode,
      requireApproval,
      allowAdditionalGuests,
      maxAdditionalGuests,
      customQuestions,
      attendeeCategories,
      whatsappEnabled,
    },
    eventGuests,
    username: user.username!,
    timeFormat: (userSettings?.preferences.dateFormat ?? "12h") as "12h" | "24h",
    featureAccess,
    paymentHistory: rawPayments.map((p) => ({
      ...p,
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    })),
    withdrawalHistory: rawWithdrawals.map((w) => ({
      ...w,
      timestamp: w.timestamp.toISOString(),
    })),
    organizerPhone: user.phoneNumber,
    financeSummary,
  };
}

export async function getDashboardEventGuests(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [userSettings] = await Promise.all([getUserSettings(user.id)]);
  const entitlements = await getResolvedEntitlements(user.id);
  const featureAccess = getEventFeatureAccess(entitlements);

  const eventData = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      date: events.date,
    })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.createdBy, user.id)))
    .limit(1);

  if (!eventData.length) {
    notFound();
  }

  const event = eventData[0];

  const settingsRows = await db
    .select({
      rsvpAccessMode: eventSettings.rsvpAccessMode,
    })
    .from(eventSettings)
    .where(eq(eventSettings.eventId, event.id))
    .limit(1);

  const rsvpAccessMode = settingsRows[0]?.rsvpAccessMode ?? "open_rsvp";

  const rawEventGuests = await db
    .select({
      id: guests.id,
      name: guests.name,
      email: guests.email,
      rsvpStatus: guests.rsvpStatus,
      rsvpNote: guests.rsvpNote,
      additionalGuestCount: guests.additionalGuestCount,
      customQuestionResponses: guests.customQuestionResponses,
      respondedAt: guests.respondedAt,
      invitationSent: guests.invitationSent,
      invitationOpened: guests.invitationOpened,
      createdAt: guests.createdAt,
    })
    .from(guests)
    .where(eq(guests.eventId, event.id));
  const eventGuests = rawEventGuests.map((guest) => ({
    ...guest,
    customQuestionResponses: normalizeCustomQuestionResponses(
      guest.customQuestionResponses,
    ),
    respondedAt: guest.respondedAt ? guest.respondedAt.toISOString() : null,
    createdAt: guest.createdAt ? guest.createdAt.toISOString() : null,
  }));

  const total = eventGuests.length;
  const { yes, no, maybe, pending } = eventGuests.reduce(
    (acc, g) => {
      if (g.rsvpStatus === "yes") acc.yes++;
      else if (g.rsvpStatus === "no") acc.no++;
      else if (g.rsvpStatus === "maybe") acc.maybe++;
      else acc.pending++;
      return acc;
    },
    { yes: 0, no: 0, maybe: 0, pending: 0 },
  );
  const guestStats = { total, yes, no, maybe, pending };
  const responseRate =
    total === 0 ? 0 : Math.round(((total - pending) / total) * 100);

  const hour12 = (userSettings?.preferences.dateFormat ?? "12h") === "12h";

  const publicUrl =
    rsvpAccessMode === "open_rsvp"
      ? getPublicEventPath(user.username!, event.slug)
      : null;

  return {
    event: { ...event, date: event.date.toISOString() },
    eventGuests,
    guestStats,
    responseRate,
    total,
    hour12,
    publicUrl,
    featureAccess,
  };
}
