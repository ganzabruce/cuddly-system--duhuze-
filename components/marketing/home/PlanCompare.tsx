import { Button } from "@/components/ui/button";
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PLAN_COMPARISON_ROWS, PLAN_IDS, PLANS } from "@/lib/constants/billing/constants";

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-semibold text-foreground">{value}</span>;
  }
  if (value) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success/12 text-success">
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return <MinusIcon className="h-4 w-4 text-muted-foreground/30" />;
}

export async function PlanCompare() {
  const t = await getTranslations("marketing");
  const groups = [...new Set(PLAN_COMPARISON_ROWS.map((row) => row.group))];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[480px] overflow-hidden rounded-md border border-border bg-card sm:min-w-145">

        {/* Column headers — plan names only */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("pricingPage.compareFeatures")}
            </p>
          </div>
          {PLAN_IDS.map((planId) => {
            const marketing = PLANS[planId].marketing;
            return (
              <div
                key={planId}
                className={cn(
                  "border-l border-border/50 px-4 py-4 text-center",
                  marketing.popular && "bg-accent-tint/40",
                )}
              >
                {marketing.popular && (
                  <span className="mb-1.5 inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                    Popular
                  </span>
                )}
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.16em]",
                    marketing.popular
                      ? "text-accent-deep dark:text-accent"
                      : "text-muted-foreground",
                  )}
                >
                  {PLANS[planId].name}
                </p>
              </div>
            );
          })}
        </div>

        {/* Feature rows grouped */}
        {groups.map((group, gi) => {
          const groupRows = PLAN_COMPARISON_ROWS.filter((row) => row.group === group);
          const isLastGroup = gi === groups.length - 1;
          return (
            <div key={group}>
              <div
                className={cn(
                  "border-b border-border/40 bg-muted/30",
                  gi > 0 && "border-t border-border/40",
                )}
              >
                <div className="px-5 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    {group}
                  </p>
                </div>
              </div>

              {groupRows.map((row, ri) => {
                const isLastRow = ri === groupRows.length - 1;
                return (
                  <div
                    key={row.label}
                    className={cn(
                      "grid grid-cols-4 transition-colors hover:bg-muted/20",
                      !(isLastRow && isLastGroup) && "border-b border-border/30",
                    )}
                  >
                    <div className="flex items-center px-5 py-3.5">
                      <span className="text-sm font-medium text-foreground">{row.label}</span>
                    </div>
                    {PLAN_IDS.map((planId) => {
                      const marketing = PLANS[planId].marketing;
                      return (
                        <div
                          key={planId}
                          className={cn(
                            "flex items-center justify-center border-l border-border/30 px-4 py-3.5",
                            marketing.popular && "bg-accent-tint/15",
                          )}
                        >
                          <FeatureCell value={row.values[planId]} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Footer CTA row */}
        <div className="grid grid-cols-4 border-t border-border bg-muted/20">
          <div className="px-5 py-4" />
          {PLAN_IDS.map((planId) => {
            const marketing = PLANS[planId].marketing;
            const isFree = planId === "free";
            const ctaLink = isFree
              ? marketing.checkoutPath
              : `${marketing.checkoutPath}&period=monthly`;
            return (
              <div
                key={planId}
                className={cn(
                  "flex items-center justify-center border-l border-border/30 px-3 py-4",
                  marketing.popular && "bg-accent-tint/30",
                )}
              >
                <Link href={ctaLink} className="w-full max-w-[140px]">
                  <Button
                    variant={isFree ? "outline" : marketing.popular ? "default" : "secondary"}
                    size="sm"
                    className="w-full text-xs font-semibold"
                  >
                    {marketing.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
