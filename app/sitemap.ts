import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/actions/events/public";
import { getAppBaseUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

const BASE_URL = getAppBaseUrl();
const LOCALES = ["en", "fr"] as const;

function localizedEntries(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => {
    const prefix = locale === "en" ? "" : `/${locale}`;
    const url = `${BASE_URL}${prefix}${path}`;
    const alternates = Object.fromEntries(
      LOCALES.map((alt) => {
        const altPrefix = alt === "en" ? "" : `/${alt}`;
        return [alt, `${BASE_URL}${altPrefix}${path}`];
      }),
    );
    return {
      url,
      changeFrequency,
      priority,
      alternates: { languages: alternates },
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.5 },
    { path: "/terms", priority: 0.5 },
    { path: "/explore", priority: 0.7 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, priority }) =>
    localizedEntries(path, "monthly", priority),
  );

  const { usernames, events: eventRows } = await getSitemapEntries();

  const profileRoutes: MetadataRoute.Sitemap = usernames.flatMap((username) =>
    localizedEntries(`/u/${username}`, "weekly", 0.6),
  );

  const eventRoutes: MetadataRoute.Sitemap = eventRows.flatMap((e) =>
    localizedEntries(`/u/${e.username}/events/${e.slug}`, "weekly", 0.8),
  );

  return [...staticRoutes, ...profileRoutes, ...eventRoutes];
}
