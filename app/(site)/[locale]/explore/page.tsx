import { getPublicExploreEvents } from "@/actions/events/public";
import { ExploreClient } from "@/components/events/ExploreClient";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("explore.title"),
    description: t("explore.description"),
    alternates: localeAlternates("/explore"),
  };
}

export default async function ExplorePage() {
  const publicEvents = await getPublicExploreEvents();

  return <ExploreClient events={publicEvents} />;
}
