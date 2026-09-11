"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TooltipContent } from "@/components/ui/tooltip";
import { useSidebar } from "./context";
import {
    sidebarMenuButtonVariants,
    type SidebarMenuButtonVariants,
} from "./menu-variants";

/** Resolve tooltip to a string title when sidebar is collapsed or on mobile */
function getTooltipTitle(
    tooltip: string | React.ComponentProps<typeof TooltipContent> | undefined,
    show: boolean,
): string | undefined {
    if (!show || !tooltip) return undefined;
    if (typeof tooltip === "string") return tooltip;
    if (typeof tooltip === "object" && "children" in tooltip)
        return String(tooltip.children);
    return undefined;
}

export type SidebarMenuLinkProps = Omit<
    React.ComponentProps<typeof Link>,
    "className"
> &
    SidebarMenuButtonVariants & {
        isActive?: boolean;
        tooltip?: string | React.ComponentProps<typeof TooltipContent>;
        className?: string;
    };

export function SidebarMenuLink({
    href,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    children,
    onClick,
    ...props
}: SidebarMenuLinkProps) {
    const { isMobile, state, setOpenMobile } = useSidebar();
    const showTitle = Boolean(tooltip && (state === "collapsed" || isMobile));
    const title = getTooltipTitle(tooltip, showTitle);

    return (
        <Link
            href={href}
            title={title}
            className={cn(
                sidebarMenuButtonVariants({ variant, size }),
                className,
            )}
            data-slot="sidebar-menu-button"
            data-sidebar="menu-button"
            data-active={isActive ? "true" : undefined}
            data-size={size}
            onClick={(e) => {
                if (isMobile) setOpenMobile(false);
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </Link>
    );
}
