import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  heading: React.ReactNode;
  subheading?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  heading,
  subheading,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 max-w-3xl sm:mb-16",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="site-eyebrow mb-4 inline-flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </p>
      )}
      <h2 className="site-h2 font-display text-balance text-foreground">
        {heading}
      </h2>
      {subheading && (
        <p className="mx-auto mt-4 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
          {subheading}
        </p>
      )}
    </div>
  );
}
