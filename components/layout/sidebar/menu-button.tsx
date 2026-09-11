"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./context";
import {
    sidebarMenuButtonVariants,
    type SidebarMenuButtonVariants,
} from "./menu-variants";

export interface SidebarMenuButtonProps
    extends useRender.ComponentProps<"button">,
        React.ComponentProps<"button">,
        SidebarMenuButtonVariants {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}

export function SidebarMenuButton({
    render,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    ...props
}: SidebarMenuButtonProps) {
    const { isMobile, state } = useSidebar();
    const comp = useRender({
        defaultTagName: "button",
        props: mergeProps<"button">(
            {
                className: cn(
                    sidebarMenuButtonVariants({ variant, size }),
                    className,
                ),
            },
            props,
        ),
        render: !tooltip ? render : TooltipTrigger,
        state: {
            slot: "sidebar-menu-button",
            sidebar: "menu-button",
            size,
            active: isActive,
        },
    });

    if (!tooltip) return comp;

    const tooltipProps =
        typeof tooltip === "string" ? { children: tooltip } : tooltip;

    return (
        <Tooltip>
            {comp}
            <TooltipContent
                side="right"
                align="center"
                hidden={state !== "collapsed" || isMobile}
                {...tooltipProps}
            />
        </Tooltip>
    );
}
