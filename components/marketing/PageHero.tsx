import { HeroPattern } from "./home/HeroPattern";

type PageHeroProps = {
  badge: string;
  headline: string | React.ReactNode;
  subtext: string;
  children?: React.ReactNode;
};

export function PageHero({ badge, headline, subtext, children }: PageHeroProps) {
  return (
    <section className="relative w-full overflow-hidden border-b border-border/50 bg-background pb-16 pt-32 sm:pb-20 sm:pt-40 lg:pt-44">
      <HeroPattern />

      {/* Gold radial top wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6">
        <div className="bn-slide mb-5 flex items-center justify-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {badge}
          </span>
        </div>

        <h1 className="bn-slide bn-d1 font-display text-balance text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          {headline}
        </h1>

        <p className="bn-slide bn-d2 mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          {subtext}
        </p>

        {children && (
          <div className="bn-slide bn-d3 mt-8 sm:mt-10">{children}</div>
        )}
      </div>

    </section>
  );
}
