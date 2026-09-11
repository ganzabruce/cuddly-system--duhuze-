import {
  CalendarDaysIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/components/marketing/shared/SectionHeader";
import { SiteSection } from "@/components/marketing/shared/SiteSection";
import { getTranslations } from "next-intl/server";
import type { SVGProps } from "react";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
};

const stepIcons = [CalendarDaysIcon, PaperAirplaneIcon, ChartBarIcon];

export async function HowItWorks() {
  const t = await getTranslations("marketing");
  const stepsData = t.raw("howItWorks.steps");

  const steps: Step[] = stepsData.map((step: { title: string; description: string }, i: number) => ({
    number: String(i + 1),
    title: step.title,
    description: step.description,
    icon: stepIcons[i],
  }));

  return (
    <SiteSection id="how-it-works" background="secondary">
      <SectionHeader
        eyebrow={t("howItWorks.eyebrow")}
        heading={
          <>
            {t("howItWorks.heading1")}{" "}
            <span className="site-accent">{t("howItWorks.headingAccent")}</span>
          </>
        }
        subheading={t("howItWorks.subheading")}
      />

      {/* desktop: horizontal with numbered circles + dashed connector */}
      <div className="relative hidden lg:block">
        {/* dashed connector line */}
        <div className="absolute top-[22px] left-[80px] right-[80px] h-px border-t-2 border-dashed border-border" />

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex flex-col items-center">
                {/* numbered circle */}
                <div className="step-circle mb-6 flex h-11 w-11 cursor-default items-center justify-center rounded-full border-2 border-border bg-card text-sm font-bold text-foreground">
                  {step.number}
                </div>

                {/* card */}
                <div className="w-full rounded-md bg-card border border-border p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display mb-2 text-base font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* mobile: vertical timeline */}
      <div className="relative lg:hidden">
        <div
          aria-hidden
          className="absolute left-[19px] top-0 bottom-0 w-[3px] rounded-full bg-border sm:left-[23px]"
        />

        <div className="flex flex-col gap-8 sm:gap-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex gap-4 sm:gap-5">
                {/* numbered dot */}
                <div className="relative z-10 flex shrink-0 items-start pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-background bg-primary text-sm font-bold text-primary-foreground sm:h-12 sm:w-12">
                    {step.number}
                  </div>
                </div>

                {/* card */}
                <div className="flex-1 rounded-md bg-card border border-border p-5 sm:p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("howItWorks.stepLabel", { number: step.number })}
                    </span>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SiteSection>
  );
}
