import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { GlobeEuropeAfricaIcon, SparklesIcon, HeartIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

const valueIcons = [SparklesIcon, GlobeEuropeAfricaIcon, HeartIcon];

export async function ValuesSection() {
  const t = await getTranslations("marketing");
  const valuesData = t.raw("values.items") as Array<{ number: string; title: string; description: string }>;

  const values = valuesData.map((v, i) => ({
    ...v,
    icon: valueIcons[i],
  }));

  return (
    <SiteSection>
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="mb-12 max-w-3xl text-center sm:mb-16 mx-auto">
          <p className="site-eyebrow mb-4 inline-flex items-center gap-2 justify-center">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            {t("values.eyebrow")}
          </p>
          <h2 className="site-h2 font-display text-balance text-foreground">
            {t("values.heading1")}{" "}
            <span className="site-accent italic">{t("values.headingAccent")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
            {t("values.subheading")}
          </p>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.number}
                className="group rounded-md border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 sm:p-8"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {value.number}
                </p>
                <h3 className="font-display mb-2 text-lg font-bold text-foreground">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </SiteSection>
  );
}
