export const SUPPORT_CATEGORIES = [
  "Account & login",
  "Events & RSVPs",
  "Guest management",
  "Notifications",
  "Payments & billing",
  "Other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
