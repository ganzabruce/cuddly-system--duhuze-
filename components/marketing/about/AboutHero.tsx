import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { getTranslations } from "next-intl/server";

export async function AboutHero() {
  const t = await getTranslations("marketing");
  const stats = t.raw("aboutHero.stats");

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background pt-32 pb-12 sm:pt-40 sm:pb-16 lg:pb-20">
      <HeroPattern />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* eyebrow */}
        <div className="bn-slide mb-5 flex items-center justify-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="site-eyebrow">{t("aboutHero.badge")}</span>
        </div>

        {/* headline */}
        <h1 className="bn-slide bn-d1 font-display text-balance text-center text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          {t("aboutHero.headline1")}{" "}
          <span className="site-accent italic">{t("aboutHero.headlineAccent")}</span>
        </h1>

        {/* description */}
        <p className="bn-slide bn-d2 mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          {t("aboutHero.description")}
        </p>

        {/* CTAs */}
        <div className="bn-slide bn-d3 mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/90 hover:shadow-[0_8px_28px_rgba(26,20,18,0.18)] active:translate-y-0"
          >
            {t("aboutHero.startFree")}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact?subject=Partnership"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-transparent px-7 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-accent hover:bg-accent-tint"
          >
            {t("aboutHero.talkToTeam")}
          </Link>
        </div>

        {/* stats */}
        <div className="bn-slide bn-d4 mx-auto mt-14 max-w-2xl">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
            {stats.map((stat: { value: string; label: string }) => (
              <div
                key={stat.label}
                className="flex flex-col items-center bg-card p-6 text-center sm:items-start sm:text-left"
              >
                <p className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
