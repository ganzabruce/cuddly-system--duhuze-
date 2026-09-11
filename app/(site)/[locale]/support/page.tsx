import { getCurrentUser } from "@/lib/services/auth/auth";
import { PageHero } from "@/components/marketing/PageHero";
import { CTA } from "@/components/marketing/home/CTA";
import { SupportForm } from "@/components/marketing/support/SupportForm";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("support.title"),
    description: t("support.description"),
    alternates: localeAlternates("/support"),
  };
}

export default async function SupportPage() {
  const user = await getCurrentUser().catch(() => null);
  const t = await getTranslations("contact");

  return (
    <>
      <PageHero
        badge={t("support.badge")}
        headline={t("support.heading")}
        subtext={t("support.subtext")}
      >
        <div className="mx-auto mt-10 w-full max-w-5xl text-left">
          <div className="rounded-md border border-border bg-card p-6 sm:p-8 md:p-10">
            <SupportForm
              defaultName={user?.name ?? ""}
              defaultEmail={user?.email ?? ""}
            />
          </div>
        </div>
      </PageHero>

      <CTA />
    </>
  );
}
