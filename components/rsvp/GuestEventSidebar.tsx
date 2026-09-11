"use client";

import { useMemo } from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateGoogleCalendarUrl, generateIcsContent } from "@/lib/constants/events/calendar";
import { EventActions } from "@/components/events/EventActions";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { cn } from "@/lib/utils";
import type { ImageFormat } from "@/types/events";
import { FlyerImage } from "@/components/events/FlyerImage";

type EventInfo = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  imageFormat?: ImageFormat;
  date: Date;
  endDate: Date | null;
  locationName: string;
  locationLink: string | null;
  username: string;
  slug: string;
  status: "published" | "completed" | "draft" | "cancelled";
};

type RsvpStatusValue = "yes" | "no" | "maybe" | null;

function statusBadge(status: RsvpStatusValue) {
  if (status === "yes")
    return { label: "Going", className: "border-success/30 bg-success/10 text-success" };
  if (status === "maybe")
    return { label: "Maybe", className: "border-warning/30 bg-warning/10 text-warning-deep" };
  if (status === "no")
    return { label: "Declined", className: "border-destructive/30 bg-destructive/10 text-destructive" };
  return { label: "Invited", className: "border-border bg-muted/50 text-muted-foreground" };
}

function statusHeading(status: RsvpStatusValue) {
  if (status === "yes") return "You're going!";
  if (status === "maybe") return "You responded Maybe";
  if (status === "no") return "You declined";
  return "You are invited";
}

export function GuestEventSidebar({
  event,
  rsvpStatus,
  guestName,
  guestEmail,
}: {
  event: EventInfo;
  rsvpStatus: RsvpStatusValue;
  guestName: string;
  guestEmail: string | null;
}) {
  const eventDate = useMemo(() => new Date(event.date), [event.date]);
  const eventEndDate = useMemo(
    () => (event.endDate ? new Date(event.endDate) : null),
    [event.endDate],
  );
  const eventPageUrl = getPublicEventPath(event.username, event.slug);
  const canonicalEventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${eventPageUrl}`;

  const badge = statusBadge(rsvpStatus);

  const googleCalendarUrl = useMemo(
    () =>
      generateGoogleCalendarUrl({
        title: event.title,
        description: event.description,
        date: eventDate,
        endDate: eventEndDate,
        locationName: event.locationName,
        locationLink: event.locationLink,
      }),
    [event.title, event.description, eventDate, eventEndDate, event.locationName, event.locationLink],
  );

  const handleDownloadIcs = () => {
    const content = generateIcsContent({
      title: event.title,
      description: event.description,
      date: eventDate,
      endDate: eventEndDate,
      locationName: event.locationName,
      locationLink: event.locationLink,
    });
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Event image with actions overlay */}
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-[0_20px_50px_-26px_rgba(0,0,0,0.45)]">
        <FlyerImage
          image={event.image}
          imageFormat={event.imageFormat ?? "square"}
          title={event.title}
          priority
          sizes="(max-width: 768px) 100vw, 44vw"
        >
          <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-linear-to-t from-black/45 to-transparent" aria-hidden />
          <div className="absolute bottom-4 right-4 z-10">
            <EventActions eventUrl={canonicalEventUrl} eventTitle={event.title} />
          </div>
        </FlyerImage>
      </section>

      {/* Status card */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className={cn("inline-flex rounded-md border px-3 py-1 text-xs font-semibold", badge.className)}>
          {badge.label}
        </div>
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {statusHeading(rsvpStatus)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Responding as {guestName}{guestEmail ? ` (${guestEmail})` : ""}
        </p>
      </section>

      {/* Add to Calendar */}
      <section className="overflow-hidden rounded-lg border border-border/70 bg-card/70 shadow-sm backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50" />
            }
          >
            <span>Add to Calendar</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="size-4" />
              <ChevronDownIcon className="size-3.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                Open in Google Calendar
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadIcs}>
              Download .ics file
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    </div>
  );
}
