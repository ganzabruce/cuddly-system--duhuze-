import type { ImageFormat } from "@/types/events";

/** An organizer's public social links. */
export type OrganizerSocials = {
  instagram?: string;
  linkedin?: string;
  x?: string;
  custom?: string;
};

/** An organizer's public location. */
export type OrganizerLocation = {
  country: string;
  city?: { name: string } | null;
};

/** Public-facing organizer profile fields. */
export type OrganizerRow = {
  name: string;
  publicEmail: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  bio: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  socials: OrganizerSocials | null;
  location: OrganizerLocation | null;
};

/** A public event tile on an organizer's profile. */
export type PublicEventRow = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  date: Date;
  locationName: string;
  locationLink: string | null;
  image: string | null;
  imageFormat?: ImageFormat;
  slug: string;
};
