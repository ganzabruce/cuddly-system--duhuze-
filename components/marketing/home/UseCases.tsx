import {
  HeartIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

const useCaseIcons = [HeartIcon, BuildingOffice2Icon, UserGroupIcon];
const tagClasses = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-success/10 text-success",
];

export async function UseCases() {
  const t = await getTranslations("marketing");
  const cases = t.raw("useCases.cases");

  const useCases = cases.map((c: { title: string; description: string; tag: string }, i: number) => ({
    icon: useCaseIcons[i],
    title: c.title,
    description: c.description,
    tag: c.tag,
    tagClass: tagClasses[i],
  }));

  return (
    <section
      id="use-cases"
      className="py-16 px-5 sm:py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="mb-12 max-w-3xl mx-auto text-center sm:mb-16">
          <p className="site-eyebrow mb-4 inline-flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            {t("useCases.eyebrow")}
          </p>
          <h2 className="site-h2 font-display text-balance text-foreground">
            {t("useCases.heading1")}{" "}
            <span className="site-accent">{t("useCases.headingAccent")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
            {t("useCases.subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc: typeof useCases[number]) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="group rounded-md border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary sm:p-8"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display mb-2 text-lg font-bold text-foreground">
                  {uc.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {uc.description}
                </p>
                <span
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${uc.tagClass}`}
                >
                  {uc.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
