export const CONTACT_SUBJECTS = [
  "General inquiry",
  "Feature request",
  "Bug report",
  "Partnership",
  "Enterprise plan",
  "Other",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];
