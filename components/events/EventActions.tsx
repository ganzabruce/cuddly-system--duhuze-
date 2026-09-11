"use client";

import { useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { mergeProps } from "@base-ui/react/merge-props";
import {
    ArrowLeftIcon,
    ShareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EventActionsProps {
    eventUrl: string;
    eventTitle: string;
    className?: string;
}

export function EventActions({
    eventUrl,
    eventTitle,
    className,
}: EventActionsProps) {
    const copyLink = useCallback(async () => {
        const resolvedUrl = eventUrl?.trim() || window.location.href;
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(resolvedUrl);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = resolvedUrl;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            toast.success("Link copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    }, [eventUrl]);

    const share = useCallback(() => {
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator
                .share({
                    title: eventTitle,
                    url: eventUrl,
                    text: `Check out ${eventTitle}`,
                })
                .catch((err) => {
                    if (err.name !== "AbortError") {
                        toast.error("Failed to share");
                    }
                });
        } else {
            copyLink();
        }
    }, [eventTitle, eventUrl, copyLink]);

    return (
        <div
            className={cn(
                "flex items-center gap-2 flex-wrap flex-1",
                className,
            )}
        >
            <Tooltip>
                <TooltipTrigger
                    render={(props) => (
                        <Button
                            {...mergeProps(props, {
                                type: "button",
                                variant: "secondary",
                                size: "icon",
                                className: "size-9 rounded-full",
                                onClick: share,
                                "aria-label": "Share event",
                            })}
                        >
                            <ShareIcon className="size-4" />
                        </Button>
                    )}
                />
                <TooltipContent side="bottom">
                    Share
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export function EventBackButton({ href }: { href: string }) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={(props) => (
                    <Link
                        href={href}
                        {...mergeProps(props, {
                            "aria-label": "Back to explore",
                            className:
                                "inline-flex items-center justify-center size-9 rounded-full bg-black/80 text-white hover:bg-black/90 border-0 shadow-lg transition-colors",
                        })}
                    >
                        <ArrowLeftIcon className="size-5" />
                    </Link>
                )}
            />
            <TooltipContent side="bottom">
                Back to explore
            </TooltipContent>
        </Tooltip>
    );
}
