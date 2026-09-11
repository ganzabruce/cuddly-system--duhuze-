import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { PublicEventCard } from "@/components/events/PublicEventCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/marketing/shared/IconBox";
import { ScrollReveal } from "@/components/marketing/shared/ScrollReveal";
import { SiteCard } from "@/components/marketing/shared/SiteCard";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { getOrganizerRow, getPublicEvents } from "@/actions/public-profile/actions";
import type { OrganizerRow, PublicEventRow } from "@/types/public-profile";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { getSafeExternalHref } from "@/lib/utils/url";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants/events/constants";
import { EventDescription } from "@/components/events/EventDescription";
import { FlyerImage } from "@/components/events/FlyerImage";

const getCachedOrganizerRow = cache(getOrganizerRow);

/* ── Helpers ── */

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Featured event card (local, does not touch PublicEventCard) ── */

function FeaturedEventCard({
  event,
  username,
}: {
  event: PublicEventRow;
  username: string;
}) {
  return (
    <Link
      href={getPublicEventPath(username, event.slug)}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-all hover:border-foreground/20 lg:flex-row"
    >
      <FlyerImage
        image={event.image}
        imageFormat={event.imageFormat ?? "square"}
        title={event.title}
        sizes="(max-width: 1024px) 100vw, 55vw"
        className="lg:w-[55%]"
      />
      <div className="flex flex-1 flex-col justify-center p-6 lg:p-8">
        {event.category && (
          <span className="site-eyebrow mb-3">
            {EVENT_CATEGORY_LABELS[event.category] ?? event.category}
          </span>
        )}
        <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {event.title}
        </h3>
        {event.description && (
          <EventDescription
            html={event.description!}
            className="mb-5 mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground"
          />
        )}
        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.locationName && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 shrink-0" />
              <span>{event.locationName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Contact list (vertical, clean) ── */

function ContactList({ user }: { user: OrganizerRow }) {
  const websiteHref = getSafeExternalHref(user.websiteUrl);
  const instagramHref = getSafeExternalHref(user.socials?.instagram);
  const linkedinHref = getSafeExternalHref(user.socials?.linkedin);
  const xHref = getSafeExternalHref(user.socials?.x);
  const customHref = getSafeExternalHref(user.socials?.custom);

  const hasAny =
    user.publicEmail ||
    user.phoneNumber ||
    websiteHref ||
    user.location ||
    instagramHref ||
    linkedinHref ||
    xHref ||
    customHref;

  if (!hasAny) return null;

  return (
    <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      {user.location?.country && (
        <li className="flex items-center gap-2">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          {user.location.city?.name ? (
            <span>
              {user.location.city.name},{" "}
              {user.location.country}
            </span>
          ) : (
            <span>{user.location.country}</span>
          )}
        </li>
      )}
      {websiteHref && (
        <li>
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">
              {websiteHref.replace(/^https?:\/\//, "")}
            </span>
          </a>
        </li>
      )}
      {user.publicEmail && (
        <li>
          <a
            href={`mailto:${user.publicEmail}`}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{user.publicEmail}</span>
          </a>
        </li>
      )}
      {user.phoneNumber && (
        <li>
          <a
            href={`tel:${user.phoneNumber}`}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span>{user.phoneNumber}</span>
          </a>
        </li>
      )}
      {instagramHref && (
        <li>
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span>Instagram</span>
          </a>
        </li>
      )}
      {linkedinHref && (
        <li>
          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span>LinkedIn</span>
          </a>
        </li>
      )}
      {xHref && (
        <li>
          <a
            href={xHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span>X</span>
          </a>
        </li>
      )}
      {customHref && (
        <li>
          <a
            href={customHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">Link</span>
          </a>
        </li>
      )}
    </ul>
  );
}

/* ── Metadata ── */

export async function generateOrganizerProfileMetadata(
  username: string,
): Promise<Metadata> {
  const user = await getCachedOrganizerRow(username);

  if (!user) {
    return { title: "Not Found | Duhuze RSVP" };
  }

  const title = `${user.name} (@${username}) – Events | Duhuze RSVP`;
  const description =
    user.tagline ?? user.bio ?? `Discover events by ${user.name} on Duhuze RSVP.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/* ── Page ── */

export async function renderOrganizerProfilePage(username: string) {
  const user = await getCachedOrganizerRow(username);

  if (!user) {
    notFound();
  }

  const publicEvents = await getPublicEvents(username);
  const now = new Date();
  const eventsWithDates = publicEvents.map((event) => ({
    ...event,
    date: new Date(event.date),
  }));
  const upcoming = eventsWithDates
    .filter((event) => event.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = eventsWithDates
    .filter((event) => event.date < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const initial = (
    user.name?.slice(0, 1) ?? username.slice(0, 1)
  ).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════ Hero ═══════ */}
      <section className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-40">
        <HeroPattern />

        {/* Gold radial top wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          {/* Identity row */}
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
            {/* Avatar with gold corner brackets */}
            <div className="relative shrink-0">
              <Avatar className="size-28 rounded-full shadow-2xl ring-[3px] ring-accent/40 ring-offset-[4px] ring-offset-background sm:size-32 md:size-36">
                <AvatarImage
                  src={user.profileImageUrl ?? undefined}
                  alt={user.name ?? username}
                />
                <AvatarFallback className="rounded-full bg-muted font-display text-4xl font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Text block */}
            <div className="flex flex-col gap-2 pt-1">
              <h1 className="bn-slide bn-d1 font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-foreground break-words sm:text-[3.2rem] md:text-[3.8rem]">
                {user.name}
              </h1>
              <p className="bn-slide bn-d2 text-lg font-medium text-muted-foreground">
                @{username}
              </p>
              {user.tagline && (
                <p className="bn-slide bn-d3 mt-0.5 max-w-2xl font-heading text-base italic leading-relaxed text-foreground/80 sm:text-lg">
                  {user.tagline}
                </p>
              )}
              {user.bio ? (
                <p className="bn-slide bn-d4 mt-2 max-w-[65ch] text-[0.95rem] leading-[1.7] text-foreground/70">
                  {user.bio}
                </p>
              ) : (
                <p className="bn-slide bn-d4 mt-2 max-w-[65ch] text-[0.95rem] leading-[1.7] text-muted-foreground">
                  Event organizer on Duhuze RSVP. Discover upcoming events and
                  RSVP.
                </p>
              )}

              {/* Contact list inside hero */}
              <div className="bn-slide bn-d5 mt-5">
                <ContactList user={user} />
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ═══════ Main Content ═══════ */}
      <main className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        {/* Stats ribbon */}
        <ScrollReveal className="pt-8 sm:pt-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <SiteCard
              variant="flat"
              className="flex flex-col items-center justify-center py-7 sm:py-9"
            >
              <span className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                {upcoming.length}
              </span>
              <span className="site-eyebrow mt-1.5">Upcoming</span>
            </SiteCard>
            <SiteCard
              variant="flat"
              className="flex flex-col items-center justify-center py-7 sm:py-9"
            >
              <span className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                {past.length}
              </span>
              <span className="site-eyebrow mt-1.5">Past</span>
            </SiteCard>
            <SiteCard
              variant="flat"
              className="flex flex-col items-center justify-center py-7 sm:py-9"
            >
              <span className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                {eventsWithDates.length}
              </span>
              <span className="site-eyebrow mt-1.5">Total</span>
            </SiteCard>
          </div>
        </ScrollReveal>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <ScrollReveal>
              <div className="mb-8 flex items-center gap-3 sm:mb-10">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                <h2 className="site-eyebrow text-foreground">
                  Upcoming Events
                </h2>
              </div>
            </ScrollReveal>

            {/* Featured first event */}
            <ScrollReveal delay={100}>
              <div className="mb-6 sm:mb-8">
                <FeaturedEventCard event={upcoming[0]} username={username} />
              </div>
            </ScrollReveal>

            {/* Remaining upcoming events */}
            {upcoming.length > 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.slice(1).map((event, i) => (
                  <ScrollReveal key={event.id} delay={i * 80}>
                    <PublicEventCard
                      id={event.id}
                      title={event.title}
                      slug={event.slug}
                      description={event.description}
                      category={event.category}
                      date={event.date}
                      locationName={event.locationName}
                      locationLink={event.locationLink}
                      image={event.image}
                      imageFormat={event.imageFormat}
                      href={getPublicEventPath(username, event.slug)}
                      className="h-full"
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <SiteSection
            id="past-events"
            background="secondary"
            className="mt-16 sm:mt-20 !px-0 sm:!px-0"
          >
            <div className="px-4 sm:px-6">
              <ScrollReveal>
                <div className="mb-8 flex items-center gap-3 sm:mb-10">
                  <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
                  <h2 className="site-eyebrow text-muted-foreground">
                    Past Events
                  </h2>
                </div>
              </ScrollReveal>

              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {past.map((event) => (
                  <div
                    key={event.id}
                    className="w-[260px] min-w-[260px] snap-start sm:w-[280px] sm:min-w-[280px]"
                  >
                    <PublicEventCard
                      id={event.id}
                      title={event.title}
                      slug={event.slug}
                      description={event.description}
                      category={event.category}
                      date={event.date}
                      locationName={event.locationName}
                      locationLink={event.locationLink}
                      image={event.image}
                      imageFormat={event.imageFormat}
                      href={getPublicEventPath(username, event.slug)}
                      className="h-full opacity-85 transition-opacity hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </SiteSection>
        )}

        {/* Empty state */}
        {eventsWithDates.length === 0 && (
          <section className="mt-16 sm:mt-20">
            <ScrollReveal>
              <SiteCard
                variant="default"
                className="flex flex-col items-center justify-center px-6 py-16 text-center"
              >
                <IconBox size="md" className="mb-5">
                  <CalendarIcon className="h-6 w-6" />
                </IconBox>
                <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                  No public events yet
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {user.name} hasn&apos;t published any events yet. Check back
                  later or explore other organizers.
                </p>
                <Button
                  variant="link"
                  className="mt-5 gap-1 [&_svg]:size-4"
                  render={<Link href="/explore" />}
                >
                  Explore events
                  <ArrowLeftIcon className="rotate-180" />
                </Button>
              </SiteCard>
            </ScrollReveal>
          </section>
        )}
      </main>
    </div>
  );
}
