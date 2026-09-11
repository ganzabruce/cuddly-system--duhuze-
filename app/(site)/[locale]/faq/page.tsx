import { FAQClient } from "@/components/marketing/FAQClient";
import { PageHero } from "@/components/marketing/PageHero";
import { CTA } from "@/components/marketing/home/CTA";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("faq.title"),
    description: t("faq.description"),
    alternates: localeAlternates("/faq"),
  };
}

export default async function FAQPage() {
  const t = await getTranslations("marketing");
  return (
    <>
      <PageHero
        badge={t("faq.heading")}
        headline={t("faq.subheading")}
        subtext={t("faq.browseAll")}
      />

      <SiteSection id="faq">
        <FAQClient />
      </SiteSection>

      <CTA />
    </>
  );
}
