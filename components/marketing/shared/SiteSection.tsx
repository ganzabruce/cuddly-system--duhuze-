import { cn } from "@/lib/utils";

type SiteSectionProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
  background?: "default" | "secondary" | "dark";
};

export function SiteSection({
  id,
  className,
  children,
  background = "default",
}: SiteSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full overflow-hidden py-16 px-5 sm:py-20 sm:px-8 lg:py-24",
        background === "secondary" && "bg-secondary",
        background === "dark" &&
          "bg-foreground text-background",
        className,
      )}
    >
      <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
