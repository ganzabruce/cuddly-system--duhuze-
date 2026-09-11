import { ContactForm } from "@/components/marketing/contact/ContactForm";
import { ContactInfo } from "@/components/marketing/contact/ContactInfo";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/components/marketing/contact-content";
import { getTranslations } from "next-intl/server";
import { localeAlternates } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("contact.title"),
    description: t("contact.description"),
    alternates: localeAlternates("/contact"),
  };
}

type ContactPageProps = {
  searchParams?: Promise<{
    subject?: string | string[];
  }>;
};

function resolveInitialSubject(value?: string | string[]): ContactSubject | "" {
  const subject = Array.isArray(value) ? value[0] : value;

  if (!subject) {
    return "";
  }

  return isContactSubject(subject) ? subject : "";
}

function isContactSubject(value: string): value is ContactSubject {
  return CONTACT_SUBJECTS.includes(value as ContactSubject);
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const initialSubject = resolveInitialSubject(params?.subject);
  const t = await getTranslations("contact");

  return (
    <>
      <section className="relative w-full overflow-hidden border-b border-border/50 bg-background pb-10 pt-20 sm:pb-20 sm:pt-32">
        <HeroPattern />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.1) 0%, transparent 100%)" }} />
        <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8">
          {/* Heading */}
          <div className="mb-12 text-center sm:mb-16">
            <div className="bn-slide mb-6 flex items-center justify-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("page.badge")}
              </span>
            </div>

            <h1 className="bn-slide bn-d1 font-display text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-5xl">
              {t("page.heading")}
            </h1>

            <p className="bn-slide bn-d2 mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("page.subtext")}
            </p>
          </div>

          {/* Form panel */}
          <div className="bn-card-in bn-d3">
            <div className="rounded-md border border-border bg-card p-6 sm:p-8 md:p-10">
              <ContactForm initialSubject={initialSubject} />
            </div>
          </div>

          {/* Info strip */}
          <div className="bn-slide bn-d5 mt-8">
            <ContactInfo />
          </div>
        </div>
      </section>
    </>
  );
}
