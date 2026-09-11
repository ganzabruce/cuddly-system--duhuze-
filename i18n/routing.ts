import { defineRouting } from "next-intl/routing";
import { getAppBaseUrl } from "@/lib/utils/url";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export function localeAlternates(path: string) {
  const base = getAppBaseUrl();
  return {
    canonical: `${base}${path}`,
    languages: Object.fromEntries(
      routing.locales.map((l) => [
        l,
        `${base}${l === routing.defaultLocale ? "" : `/${l}`}${path}`,
      ]),
    ),
  };
}
