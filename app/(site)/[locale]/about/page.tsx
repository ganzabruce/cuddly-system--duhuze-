import { AboutHero } from "@/components/marketing/about/AboutHero";
import { AppShowcase } from "@/components/marketing/about/AppShowcase";
import { StoryVision } from "@/components/marketing/about/StoryVision";
import { ValuesSection } from "@/components/marketing/about/ValuesSection";
import { CTA } from "@/components/marketing/home/CTA";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: localeAlternates("/about"),
  };
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <StoryVision />
      <AppShowcase />
      <ValuesSection />
      <CTA />
    </>
  );
}
