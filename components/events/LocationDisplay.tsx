"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Display label is locationName. When a location URL is present, the label is clickable and copies the link.
 */
export interface LocationDisplayProps {
    locationName: string;
    locationLink: string | null;
    className?: string;
    iconClassName?: string;
    /** Kept for API compatibility; no longer affects layout (label is the link). */
    compact?: boolean;
}

export function LocationDisplay({
    locationName,
    locationLink,
    className,
    iconClassName,
}: LocationDisplayProps) {
    const hasLink = Boolean(locationLink?.trim());
    const label = locationName?.trim();
    if (!label) return null;

    const copyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!hasLink) return;
        if (typeof navigator === "undefined" || !navigator.clipboard) {
            toast.error("Clipboard is not available.");
            return;
        }
        navigator.clipboard.writeText(locationLink!).then(
            () => toast.success("Link copied to clipboard."),
            () => toast.error("Failed to copy link.")
        );
    };

    return (
        <div
            className={cn("flex items-center gap-2 flex-wrap", className)}
            onClick={(e) => e.stopPropagation()}
        >
            <MapPinIcon
                className={cn("h-4 w-4 text-primary/70 flex-shrink-0", iconClassName)}
            />
            {hasLink ? (
                <Button
                    type="button"
                    variant="link"
                    onClick={copyLink}
                    title="Copy location link"
                    className="h-auto p-0 text-left font-medium line-clamp-1"
                >
                    {label}
                </Button>
            ) : (
                <span className="line-clamp-1">{label}</span>
            )}
        </div>
    );
}
