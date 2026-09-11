"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { usePathname as useNextPathname } from "next/navigation";
import { LanguageIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const localeNames: Record<string, string> = {
  en: "Français",
  fr: "English",
};

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const intlPathname = usePathname();
  const nextPathname = useNextPathname();

  const nextLocale = locale === "en" ? "fr" : "en";

  function switchLocale() {
    const isDashboardOrAuth =
      nextPathname.startsWith("/app") ||
      nextPathname.startsWith("/admin") ||
      nextPathname.startsWith("/login") ||
      nextPathname.startsWith("/signup") ||
      nextPathname.startsWith("/onboarding");

    if (isDashboardOrAuth) {
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
      window.location.reload();
    } else {
      router.push(intlPathname, { locale: nextLocale });
    }
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      title={localeNames[locale]}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <LanguageIcon className="h-4 w-4" />
    </button>
  );
}
