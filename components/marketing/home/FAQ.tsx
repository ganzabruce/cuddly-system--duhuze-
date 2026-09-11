"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/marketing/shared/SectionHeader";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  faqs: FAQItem[];
  heading?: string;
  subheading?: string;
  showMoreLink?: boolean;
}

export function FAQ({
  faqs,
  heading,
  subheading,
  showMoreLink = false,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations("marketing");

  return (
    <SiteSection id="faq">
      <SectionHeader heading={heading ?? t("faq.heading")} subheading={subheading ?? t("faq.subheading")} />

      <div className="mx-auto max-w-3xl">
        <div>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const num = String(index + 1).padStart(2, "0");

            return (
              <Collapsible
                key={faq.question}
                open={isOpen}
                onOpenChange={(open) => setOpenIndex(open ? index : null)}
              >
                <div className={cn("relative transition-colors duration-300", isOpen && "bg-accent-tint/25 dark:bg-accent-tint/10")}>
                  <span className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-300", isOpen ? "bg-accent opacity-100" : "opacity-0")} />

                  <CollapsibleTrigger className="group flex w-full items-center gap-4 px-5 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:gap-5 sm:px-6 sm:py-6 cursor-pointer">
                    <span className={cn("w-8 shrink-0 font-display text-xs font-bold tabular-nums tracking-[0.18em] select-none transition-colors duration-300", isOpen ? "text-accent" : "text-muted-foreground/30 group-hover:text-muted-foreground/55")}>
                      {num}
                    </span>
                    <span className={cn("flex-1 font-display text-sm font-bold tracking-tight transition-colors duration-200 sm:text-lg", isOpen ? "text-foreground" : "text-foreground/80 group-hover:text-foreground")}>
                      {faq.question}
                    </span>
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-all duration-200", isOpen ? "border-accent/40 bg-accent/10 text-accent" : "border-border/40 text-muted-foreground/50 group-hover:border-border group-hover:text-muted-foreground")}>
                      <span className={cn("relative flex h-3 w-3 transition-transform duration-300", isOpen && "rotate-45")}>
                        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-px rounded-full bg-current" />
                        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-px rounded-full bg-current" />
                      </span>
                    </span>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
                    <p className="pb-6 pl-12 pr-6 text-sm leading-7 text-muted-foreground sm:pb-7 sm:pl-14 sm:text-base">
                      {faq.answer}
                    </p>
                  </CollapsibleContent>
                </div>
                <div className="h-px bg-border/55" />
              </Collapsible>
            );
          })}
        </div>

        {showMoreLink && (
          <div className="mt-10 flex justify-center">
            <Link href="/faq">
              <Button variant="link" className="underline hover:text-accent">
                {t("faq.browseAll")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </SiteSection>
  );
}
