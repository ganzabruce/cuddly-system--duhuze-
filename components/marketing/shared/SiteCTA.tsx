import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteCTAProps = {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "primary" | "outline";
  className?: string;
};

export function SiteCTA({
  href,
  children,
  variant = "dark",
  className,
}: SiteCTAProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0";

  const variants = {
    dark: "bg-accent text-accent-foreground hover:bg-accent/90",
    primary:
      "bg-accent text-accent-foreground hover:bg-accent/90",
    outline:
      "border border-border bg-transparent text-foreground hover:border-primary/40 hover:bg-secondary",
  };

  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
