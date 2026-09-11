import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  variant?: "card" | "plain";
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  subtitle,
  label,
  variant = "card",
  actions,
  className,
}: DashboardPageHeaderProps) {
  const content = (
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-3",
      variant === "card" && "p-4",
    )}>
      <div>
        {label && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
            {label}
          </p>
        )}
        <h1 className={cn(
          "m-0 p-0 font-semibold text-foreground",
          variant === "plain" ? "font-display text-2xl font-bold tracking-tight" : "text-xl",
        )}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex w-full items-center justify-end gap-2 sm:w-auto">{actions}</div>}
    </div>
  );

  if (variant === "card") {
    return (
      <div className={cn("mb-6 rounded-md border border-border bg-card", className)}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("mb-6", className)}>
      {content}
    </div>
  );
}
