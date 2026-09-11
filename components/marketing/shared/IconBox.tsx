import { cn } from "@/lib/utils";

type IconBoxProps = {
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
};

export function IconBox({ children, size = "md", className }: IconBoxProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary",
        size === "sm" ? "h-9 w-9" : "h-11 w-11",
        className,
      )}
    >
      {children}
    </div>
  );
}
