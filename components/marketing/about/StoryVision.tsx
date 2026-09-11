import { SiteCard } from "@/components/marketing/shared/SiteCard";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { getTranslations } from "next-intl/server";

export async function StoryVision() {
  const t = await getTranslations("marketing");

  return (
    <SiteSection>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
          {/* story */}
          <div>
            <p className="site-eyebrow mb-4 inline-flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              {t("storyVision.storyEyebrow")}
            </p>
            <h2 className="site-h2 font-display text-balance text-foreground">
              {t("storyVision.storyHeading1")}{" "}
              <span className="site-accent italic">{t("storyVision.storyHeadingAccent")}</span>
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {t("storyVision.storyP1")}
              </p>
              <p>
                {t("storyVision.storyP2")}
              </p>
              <p>
                {t("storyVision.storyP3")}
              </p>
            </div>
          </div>

          {/* vision card */}
          <div className="lg:pt-10">
            <SiteCard className="border-l-4 border-l-accent">
              <div className="p-6 sm:p-8">
                <p className="site-eyebrow mb-4">{t("storyVision.visionEyebrow")}</p>
                <blockquote className="font-display text-xl leading-relaxed text-foreground sm:text-2xl">
                  &ldquo;{t("storyVision.visionQuote")}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("storyVision.visionAttribution")}
                  </span>
                </div>
              </div>
            </SiteCard>
          </div>
        </div>
      </div>
    </SiteSection>
  );
}
