"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ThemeImage } from "@/components/ui/theme-image";
import { staticImages } from "@/public";
import { HeroPattern } from "./HeroPattern";
import { usePWAInstall } from "@/components/providers/PWAInstallProvider";

export function Hero() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const t = useTranslations("marketing");

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-svh w-full flex-col items-center justify-center overflow-hidden border-b border-border/50 bg-background"
    >
      {/* Gold radial top wash — wide and thin so it reads as a band, not a dome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }} />

      <HeroPattern />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-10 pt-28 sm:px-8 sm:pb-12 sm:pt-36 md:pt-40 lg:pt-44">

        <h1 className="bn-slide bn-d1 site-h1 font-display text-balance text-center text-foreground">
          {t("hero.headline1")}
          <br className="hidden sm:block" />
          {t("hero.headline2")} <span className="text-accent">{t("hero.headlineAccent")}</span>
        </h1>

        <p className="bn-slide bn-d2 mx-auto mt-5 max-w-[480px] text-center text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          {t("hero.subtext")}
        </p>

        <div className="bn-slide bn-d3 mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-[0_8px_28px_rgba(213,176,57,0.35)] active:translate-y-0"
          >
            {t("hero.cta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          {canInstall && !isInstalled ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={install}
              className="border-border bg-transparent px-7 gap-1.5 text-sm font-medium text-foreground hover:border-accent hover:bg-accent-tint"
            >
              {t("hero.installApp")}
            </Button>
          ) : (
            <Button
              render={<Link href="/about" />}
              variant="outline"
              size="lg"
              className="border-border bg-transparent px-7 gap-1.5 text-sm font-medium text-foreground hover:border-accent hover:bg-accent-tint"
            >
              {t("hero.learnMore")}
            </Button>
          )}
        </div>

        <p className="bn-slide bn-d4 mt-6 text-center text-xs font-medium text-muted-foreground/70">
          {t("hero.freeNote")}
        </p>
      </div>

      <div
        className="bn-slide bn-d5 relative mx-auto mt-12 h-[420px] w-full max-w-7xl px-5 pb-4 sm:h-[480px] sm:px-8 sm:pb-8 lg:h-[560px]"
        style={{ animationDelay: "460ms" }}
      >
        <div className="relative h-full overflow-hidden rounded-md border border-border/80 bg-card/90 p-0 shadow-lg">
          <ThemeImage
            lightSrc={staticImages.dashboardLight}
            darkSrc={staticImages.dashboardDark}
            alt="Duhuze dashboard — guest management overview"
            width={1200}
            height={800}
            priority
            className="h-full w-full rounded-md border border-border/60 object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
