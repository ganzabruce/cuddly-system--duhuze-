import { CTA } from "@/components/marketing/home/CTA";
import { FAQ } from "@/components/marketing/home/FAQ";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { PlanCompare } from "@/components/marketing/home/PlanCompare";
import { Pricing } from "@/components/marketing/home/Pricing";
import { SectionHeader } from "@/components/marketing/shared/SectionHeader";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import faqContent from "@/components/marketing/faq-content.json";
import { getActivePromotionAction } from "@/actions/billing/actions";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("pricing.title"),
    description: t("pricing.description"),
    alternates: localeAlternates("/pricing"),
  };
}

export default async function PricingPage() {
  const activePromotion = await getActivePromotionAction();
  const t = await getTranslations("marketing");
  return (
    <>
      {/* ── Hero + plan cards ── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-background pt-32 pb-12 sm:pt-40 sm:pb-16 lg:pb-20">
        <HeroPattern />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }} />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="bn-slide mb-5 flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("pricingSection.eyebrow")}
              </span>
            </div>
            <h1 className="bn-slide bn-d1 font-display text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t("pricingPage.heading1")}{" "}
              <span className="font-accent italic font-normal text-primary">{t("pricingPage.headingAccent")}</span>
            </h1>
            <p className="bn-slide bn-d2 mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
              {t("pricingPage.subheading")}
            </p>
          </div>
          <div className="bn-slide bn-d3 w-full">
            <Pricing activePromotion={activePromotion} />
          </div>
        </div>

      </section>

      {/* ── Compare plans ── */}
      <SiteSection id="compare-plans" background="secondary">
        <SectionHeader
          eyebrow={t("pricingPage.compareEyebrow")}
          heading={t("pricingPage.compareHeading")}
          subheading={t("pricingPage.compareSubheading")}
        />
        <PlanCompare />
      </SiteSection>

      {/* ── FAQ ── */}
      <FAQ
        faqs={faqContent.faq.Pricing}
        heading={t("pricingPage.faqHeading")}
        subheading={t("pricingPage.faqSubheading")}
      />

      <CTA />
    </>
  );
}
