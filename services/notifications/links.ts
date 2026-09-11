export function dashboardEventLink(slug: string | null | undefined): string {
  if (!slug) return "/app/events";
  return `/app/events/${slug}`;
}

export function dashboardEventGuestsLink(slug: string | null | undefined): string {
  if (!slug) return "/app/guests";
  return `/app/events/${slug}/guests`;
}

