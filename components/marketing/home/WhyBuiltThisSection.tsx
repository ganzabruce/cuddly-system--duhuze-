import Image from "next/image";
import { staticImages } from "@/public";
import { getTranslations } from "next-intl/server";

export async function WhyBuiltThisSection() {
  const t = await getTranslations("marketing");
  const tags = t.raw("whyBuiltThis.tags") as string[];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <div className="relative z-10 aspect-square overflow-hidden rounded-md border border-border/60 shadow-sm">
            <Image
              src={staticImages.organizers}
              fill
              alt="Event organizers using Duhuze RSVP"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {t("whyBuiltThis.eyebrow")}
          </p>
          <h2
            className="font-display text-balance font-bold leading-[1.1] tracking-[-0.02em] text-foreground"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("whyBuiltThis.heading1")}
            <br />
            <span className="font-accent italic font-normal text-primary">
              {t("whyBuiltThis.heading2")}
            </span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
            {t("whyBuiltThis.description")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
