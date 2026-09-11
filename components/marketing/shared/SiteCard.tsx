import { cn } from "@/lib/utils";

type SiteCardProps = {
  children: React.ReactNode;
  variant?: "default" | "flat";
  className?: string;
  hoverLift?: boolean;
};

export function SiteCard({
  children,
  variant = "default",
  className,
  hoverLift = false,
}: SiteCardProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "default" &&
          "border border-border bg-card",
        variant === "flat" && "bg-secondary",
        hoverLift &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
