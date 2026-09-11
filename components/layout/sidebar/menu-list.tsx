"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function SidebarMenu(attrs: React.ComponentProps<"ul">) {
    const { className, ...props } = attrs;
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cn(
                "flex w-full min-w-0 flex-col gap-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-3",
                className,
            )}
            {...props}
        />
    );
}

export function SidebarMenuItem(attrs: React.ComponentProps<"li">) {
    const { className, ...props } = attrs;
    return (
        <li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            className={cn(
                "group/menu-item relative",
                className,
            )}
            {...props}
        />
    );
}
