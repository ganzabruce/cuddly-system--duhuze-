import { PageHero } from "@/components/marketing/PageHero";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
    alternates: localeAlternates("/privacy"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const privacy = t.raw("privacy");
  return (
    <>
      <PageHero {...privacy.hero} />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {/* Table of contents */}
        <nav className="mb-12 rounded-md border border-border/50 bg-card/60 p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {privacy.contents}
          </h2>
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
            {privacy.sections.map((s: { id: string; title: string }) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="transition-colors hover:text-primary"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Prose body */}
        <div className="space-y-10">
          {privacy.sections.map((section: { id: string; title: string; body: string; callout?: string }) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display mb-3 text-xl font-bold text-foreground sm:text-2xl">
                {section.title}
              </h2>
              {section.callout && (
                <div className="mb-4 border-l-2 border-primary/50 bg-primary/[0.04] py-3 pl-4 pr-3 text-sm leading-relaxed text-muted-foreground">
                  {section.callout}
                </div>
              )}
              <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {section.body}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground/60">
          {privacy.lastUpdated}
        </p>
      </section>
    </>
  );
}
