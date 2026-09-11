import { getTranslations } from "next-intl/server";

export async function ValuesSliderSection() {
  const t = await getTranslations("marketing");
  const items = t.raw("valuesMarquee.items") as string[];

  return (
    <section className="home-bento-marquee py-5">
      <div className="home-bento-marquee-track">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-4">
            {items.map((item) => (
              <span key={`${i}-${item}`} className="flex items-center gap-8">
                <span className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {item}
                </span>
                <span className="text-[8px] text-primary">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
