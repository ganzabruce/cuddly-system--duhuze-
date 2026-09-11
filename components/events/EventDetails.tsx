import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { formatTime, getTimezoneAbbr } from "@/lib/utils/format";
import { getSafeExternalHref } from "@/lib/utils/url";
import { EventDescription } from "./EventDescription";

function formatTimeRange(start: Date, end: Date | null, hour12: boolean, timeZone?: string) {
  const startStr = formatTime(start, { hour12, timeZone });
  const abbr = getTimezoneAbbr(start, timeZone);
  const suffix = abbr ? ` (${abbr})` : "";
  if (!end) return `${startStr}${suffix}`;
  return `${startStr} – ${formatTime(end, { hour12, timeZone })}${suffix}`;
}

export function EventTitle({
  title,
  description,
  showEmptyDescription = false,
}: {
  title: string;
  description: string | null;
  showEmptyDescription?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem]">
        {title}
      </h1>
      {description ? (
        <EventDescription
          html={description}
          className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base"
        />
      ) : showEmptyDescription ? (
        <p className="text-sm italic text-muted-foreground/60">No description provided</p>
      ) : null}
    </section>
  );
}

function formatFullDate(date: Date, timeZone?: string) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", ...(timeZone && { timeZone }) });
}

export function EventDateBadge({
  date,
  endDate,
  useHour12,
  timezone,
}: {
  date: Date;
  endDate: Date | null;
  useHour12: boolean;
  timezone?: string;
}) {
  const isMultiDay = endDate && endDate.toDateString() !== date.toDateString();

  return (
    <section>
      <div className="flex items-start gap-3">
        <CalendarDaysIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        {isMultiDay ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">
              {formatFullDate(date, timezone)}, {formatTime(date, { hour12: useHour12, timeZone: timezone })}
            </span>
            <span className="text-sm text-muted-foreground">
              ↳ {formatFullDate(endDate, timezone)}, {formatTime(endDate, { hour12: useHour12, timeZone: timezone })}
              {(() => { const abbr = getTimezoneAbbr(date, timezone); return abbr ? ` (${abbr})` : null; })()}
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {formatFullDate(date, timezone)}
            </span>
            <span className="tabular-nums text-sm text-muted-foreground">
              {formatTimeRange(date, endDate, useHour12, timezone)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function EventLocation({
  locationName,
  locationLink,
  children,
}: {
  locationName: string;
  locationLink: string | null;
  children?: React.ReactNode;
}) {
  const safeLocationHref = getSafeExternalHref(locationLink ?? undefined);
  const isInPerson = locationName !== "Online";
  const hasLocationLink = Boolean(safeLocationHref);
  const locationLinkLabel = isInPerson ? "View on map" : "Join meeting";
  const locationTitle = locationName;

  if (!locationTitle) return null;

  return (
    <section>
      <div className="flex items-start gap-3">
        <MapPinIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{locationTitle}</p>
          {hasLocationLink && (
            <a
              href={safeLocationHref!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-deep underline underline-offset-2"
            >
              {locationLinkLabel}
            </a>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
