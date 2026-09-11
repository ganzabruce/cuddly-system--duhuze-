import faqContent from "@/components/marketing/faq-content.json";

export function FAQClient() {
  const sections = Object.entries(faqContent.faq);

  return (
    <div className="mx-auto max-w-7xl overflow-hidden rounded-md border border-border bg-card">
      {sections.map(([category, entries], ci) => {
        const isLast = ci === sections.length - 1;

        return (
          <div key={category}>
            {/* Category header */}
            <div
              className={
                ci > 0
                  ? "border-t border-b border-border/40 bg-muted/30"
                  : "border-b border-border/40 bg-muted/30"
              }
            >
              <div className="px-6 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  {category}
                </p>
              </div>
            </div>

            {/* Q&A rows */}
            {entries.map((entry, ei) => {
              const isLastRow = ei === entries.length - 1;
              return (
                <div
                  key={entry.question}
                  className={
                    !(isLastRow && isLast)
                      ? "grid grid-cols-1 border-b border-border/30 transition-colors hover:bg-muted/20 sm:grid-cols-5"
                      : "grid grid-cols-1 transition-colors hover:bg-muted/20 sm:grid-cols-5"
                  }
                >
                  <div className="flex items-start px-6 py-5 sm:col-span-2">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.question}
                    </p>
                  </div>
                  <div className="flex items-start border-border/30 px-6 pb-5 sm:col-span-3 sm:border-l sm:py-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {entry.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
