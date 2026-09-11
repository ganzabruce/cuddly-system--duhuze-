import { getIconComponent } from "@/components/events/icon-map";
import { SiteSection } from "../shared/SiteSection";
import landingContent from "@/components/marketing/landing-content.json";
import { getTranslations } from "next-intl/server";

type FeatureContent = {
  title: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
};

type FeaturesProps = {
  features?: FeatureContent[];
};

export async function Features({ features: cmsFeatures }: FeaturesProps) {
  const features =
    cmsFeatures && cmsFeatures.length > 0 ? cmsFeatures : landingContent.features;
  const activeFeatures = features
    .filter((f) => f.isActive)
    .sort((a, b) => a.order - b.order);
  const t = await getTranslations("marketing");

  return (
    <SiteSection
      id="features"
      background="secondary"
      className="relative scroll-mt-16 overflow-hidden py-16 px-5 sm:py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        {/* section header */}
        <div className="relative z-10 mb-12 max-w-3xl text-center sm:mb-16">
          <p className="site-eyebrow mb-4 inline-flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            {t("features.eyebrow")}
          </p>
          <h2 className="site-h2 font-display text-balance text-foreground">
            {t("features.heading1")}{" "}
            <span className="site-accent">{t("features.headingAccent")}</span> {t("features.heading2")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t("features.subheading")}
          </p>
        </div>

        {/* feature grid */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {activeFeatures.map((feature) => {
            const Icon = getIconComponent(feature.icon);
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-md border border-transparent bg-secondary p-6 transition-all duration-300 hover:border-primary sm:p-7"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <h3 className="font-display mb-2 text-base font-bold text-foreground sm:text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </SiteSection>
  );
}
