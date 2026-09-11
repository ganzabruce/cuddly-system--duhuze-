import Link from "next/link";
import { cn } from "@/lib/utils";

export type StatCardVariant = "default" | "success" | "warning" | "destructive";

const variantClasses: Record<StatCardVariant, string> = {
    default:     "text-foreground",
    success:     "text-success",
    warning:     "text-warning",
    destructive: "text-destructive",
};

type StatCardProps = {
    title: string;
    value: number | string;
    icon?: React.ComponentType<{ className?: string }>;
    href?: string;
    variant?: StatCardVariant;
    suffix?: string;
    muted?: boolean;
};

export function StatCard({
    title,
    value,
    icon: Icon,
    href,
    variant = "default",
    suffix,
    muted = false,
}: StatCardProps) {
    const content = (
        <>
            <div className="mb-3 flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </span>
            </div>
            <span
                className={cn(
                    "font-display text-3xl font-bold leading-none tracking-tight tabular-nums",
                    muted ? "text-muted-foreground" : variantClasses[variant],
                )}
            >
                {value}
                {suffix && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span>
                )}
            </span>
        </>
    );

    const className =
        "group flex min-w-0 flex-col rounded-md border border-border bg-card p-4 transition-all hover:border-foreground/20";

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return <article className={className}>{content}</article>;
}
