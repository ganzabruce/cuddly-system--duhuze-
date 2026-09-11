export function getPublicProfilePath(username: string): string {
  return `/u/${username}`;
}

export function getPublicEventPath(username: string, eventSlug: string): string {
  return `${getPublicProfilePath(username)}/events/${eventSlug}`;
}

export function getPublicEventInvitePath(
  username: string,
  eventSlug: string,
  token: string,
): string {
  return `${getPublicEventPath(username, eventSlug)}/invite/${token}`;
}

export function getPublicEventGuestPath(
  username: string,
  eventSlug: string,
  token: string,
): string {
  return `${getPublicEventPath(username, eventSlug)}/guest/${token}`;
}
