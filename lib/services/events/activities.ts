import db from "@/lib/db";
import { events, guests } from "@/lib/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { Activity } from "@/types/activities";

export async function fetchRecentActivities(
    userId: number,
): Promise<Activity[]> {
    const activities: Activity[] = [];

    const [recentEvents, recentGuests, recentRSVPs, recentInvitations] =
        await Promise.all([
            // Recent events created
            db
                .select({
                    id: events.id,
                    title: events.title,
                    description: events.description,
                    createdAt: events.createdAt,
                })
                .from(events)
                .where(eq(events.createdBy, userId))
                .orderBy(desc(events.createdAt))
                .limit(5),

            // Recent guests added
            db
                .select({
                    id: guests.id,
                    name: guests.name,
                    eventTitle: events.title,
                    eventDescription: events.description,
                    createdAt: guests.createdAt,
                })
                .from(guests)
                .innerJoin(events, eq(guests.eventId, events.id))
                .where(eq(events.createdBy, userId))
                .orderBy(desc(guests.createdAt))
                .limit(5),

            // Recent RSVPs
            db
                .select({
                    id: guests.id,
                    name: guests.name,
                    rsvpStatus: guests.rsvpStatus,
                    eventTitle: events.title,
                    eventDescription: events.description,
                    respondedAt: guests.respondedAt,
                })
                .from(guests)
                .innerJoin(events, eq(guests.eventId, events.id))
                .where(
                    and(eq(events.createdBy, userId), isNotNull(guests.respondedAt)),
                )
                .orderBy(desc(guests.respondedAt))
                .limit(5),

            // Recent invitations sent
            db
                .select({
                    id: guests.id,
                    name: guests.name,
                    eventTitle: events.title,
                    eventDescription: events.description,
                    sentAt: guests.invitationSentAt,
                })
                .from(guests)
                .innerJoin(events, eq(guests.eventId, events.id))
                .where(
                    and(
                        eq(events.createdBy, userId),
                        isNotNull(guests.invitationSentAt),
                    ),
                )
                .orderBy(desc(guests.invitationSentAt))
                .limit(5),
        ]);

    recentEvents.forEach((event) => {
        activities.push({
            id: `event-${event.id}`,
            title: `Created ${event.title}`,
            description: event.description || "",
            timestamp: event.createdAt ?? new Date(0),
            details: event.title,
            icon: "calendar",
        });
    });

    recentGuests.forEach((guest) => {
        activities.push({
            id: `guest-${guest.id}`,
            title: `Added ${guest.name}`,
            description: `Guest added to ${guest.eventTitle}${guest.eventDescription ? `. ${guest.eventDescription}` : ""}`,
            timestamp: guest.createdAt ?? new Date(0),
            details: `${guest.name} - ${guest.eventTitle}`,
            icon: "user",
        });
    });

    recentRSVPs.forEach((rsvp) => {
        activities.push({
            id: `rsvp-${rsvp.id}`,
            title: `RSVP by ${rsvp.name}`,
            description: `Responded with ${rsvp.rsvpStatus}${rsvp.eventDescription ? `. ${rsvp.eventDescription}` : ""}`,
            timestamp: rsvp.respondedAt ?? new Date(0),
            details: `${rsvp.name} - ${rsvp.rsvpStatus}`,
            icon: "check",
        });
    });

    recentInvitations.forEach((invitation) => {
        activities.push({
            id: `invitation-${invitation.id}`,
            title: `Invited ${invitation.name}`,
            description: `To ${invitation.eventTitle}${invitation.eventDescription ? `. ${invitation.eventDescription}` : ""}`,
            timestamp: invitation.sentAt ?? new Date(0),
            details: `${invitation.name} - ${invitation.eventTitle}`,
            icon: "mail",
        });
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, 10);
}
