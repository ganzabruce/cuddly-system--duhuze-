import { CTA } from "@/components/marketing/home/CTA";
import { FAQ } from "@/components/marketing/home/FAQ";
import { Features } from "@/components/marketing/home/Features";
import { Hero } from "@/components/marketing/home/Hero";
import { HowItWorks } from "@/components/marketing/home/HowItWorks";
import { Pricing } from "@/components/marketing/home/Pricing";
import { UseCases } from "@/components/marketing/home/UseCases";
import { ValuesSliderSection } from "@/components/marketing/home/ValuesSliderSection";
import { WhyBuiltThisSection } from "@/components/marketing/home/WhyBuiltThisSection";
import faqContent from "@/components/marketing/faq-content.json";
import { getActivePromotionAction } from "@/actions/billing/actions";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("home.title"),
    description: t("home.description"),
    alternates: localeAlternates("/"),
  };
}

export default async function Home() {
  const activePromotion = await getActivePromotionAction();
  const t = await getTranslations("marketing");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex flex-1 flex-col">
        <Hero />
        <ValuesSliderSection />
        <HowItWorks />
        <Features />
        <WhyBuiltThisSection />
        <UseCases />

        <div
          id="pricing"
          className="scroll-mt-16 border-y border-border bg-secondary/45"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 sm:gap-8 sm:px-6 sm:py-16 lg:py-20">
            <div className="flex max-w-3xl flex-col items-center gap-2 text-center sm:gap-3">
              <span className="site-eyebrow inline-flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                {t("pricingSection.eyebrow")}
              </span>
              <h2 className="site-h2 font-display mt-4 text-balance text-foreground">
                {t("pricingSection.heading1")}{" "}
                <span className="site-accent">{t("pricingSection.headingAccent")}</span>
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {t("pricingSection.subheading")}
                <br /> {t("pricingSection.subheadingLine2")}
              </p>
            </div>
            <Pricing activePromotion={activePromotion} />
          </div>
        </div>

        <FAQ faqs={faqContent.home} showMoreLink />
        <CTA />
      </main>
    </div>
  );
}
