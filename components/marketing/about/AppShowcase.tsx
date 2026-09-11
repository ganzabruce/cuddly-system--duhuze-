import { SectionHeader } from "@/components/marketing/shared/SectionHeader";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { ThemeImage } from "@/components/ui/theme-image";
import { screenshots } from "@/public";
import { getTranslations } from "next-intl/server";

const screenshotKeys = ["overview", "guests", "analytics", "event"] as const;

export async function AppShowcase() {
  const t = await getTranslations("marketing");
  const items = t.raw("appShowcase.items") as Array<{ title: string; description: string }>;

  const showcases = items.map((item, i) => ({
    title: item.title,
    description: item.description,
    light: screenshots[screenshotKeys[i]].light,
    dark: screenshots[screenshotKeys[i]].dark,
  }));

  return (
    <SiteSection background="secondary">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("appShowcase.eyebrow")}
          heading={
            <>
              {t("appShowcase.heading1")}{" "}
              <span className="site-accent italic">{t("appShowcase.headingAccent")}</span>
            </>
          }
          subheading={t("appShowcase.subheading")}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {showcases.map((item) => (
            <div
              key={item.title}
              className="group overflow-hidden rounded-md border border-border bg-card transition-all duration-300 hover:border-foreground/20"
            >
              <div className="overflow-hidden border-b border-border">
                <ThemeImage
                  lightSrc={item.light}
                  darkSrc={item.dark}
                  alt={item.title}
                  width={800}
                  height={500}
                  className="h-auto w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-display text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteSection>
  );
}
