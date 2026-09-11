import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";
import { getPublicEventData } from "@/actions/events/public";
import { stripHtml } from "@/lib/utils";
import { PublicEventClient } from "@/components/events/PublicEventClient";
import { getTranslations } from "next-intl/server";

const getPublicEvent = cache(async (username: string, eventSlug: string) =>
  getPublicEventData(username, eventSlug),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string; eventSlug: string }>;
}): Promise<Metadata> {
  const { locale, username, eventSlug } = await params;
  const t = await getTranslations({ locale, namespace: "events.publicEvent" });

  const result = await getPublicEvent(username, eventSlug);
  if ("error" in result) {
    return {
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
    };
  }

  const { event } = result.data;
  const title = `${event.title} | Duhuze RSVP`;
  const description =
    (event.description ? stripHtml(event.description) : null) ||
    t("invitedTo", { title: event.title });

  return {
    title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.image ? [event.image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: event.image ? [event.image] : [],
    },
  };
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; eventSlug: string }>;
  searchParams: Promise<{ inviteToken?: string }>;
}) {
  const { username, eventSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const inviteToken = resolvedSearchParams.inviteToken?.trim() || undefined;

  const result = await getPublicEvent(username, eventSlug);
  if ("error" in result) {
    notFound();
  }

  return (
    <PublicEventClient
      data={result.data}
      username={username}
      eventSlug={eventSlug}
      inviteToken={inviteToken}
    />
  );
}
