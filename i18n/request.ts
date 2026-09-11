import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!hasLocale(routing.locales, locale)) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    locale = hasLocale(routing.locales, cookieLocale)
      ? cookieLocale
      : routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      common: (await import(`../messages/${locale}/common.json`)).default,
      metadata: (await import(`../messages/${locale}/metadata.json`)).default,
      marketing: (await import(`../messages/${locale}/marketing.json`)).default,
      faq: (await import(`../messages/${locale}/faq.json`)).default,
      legal: (await import(`../messages/${locale}/legal.json`)).default,
      contact: (await import(`../messages/${locale}/contact.json`)).default,
      events: (await import(`../messages/${locale}/events.json`)).default,
    },
  };
});
