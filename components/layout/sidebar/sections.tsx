"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./context";

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-header"
            data-sidebar="header"
            className={cn("gap-2 p-2 flex flex-col", className)}
            {...props}
        />
    );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-footer"
            data-sidebar="footer"
            className={cn("gap-2 p-2 flex flex-col", className)}
            {...props}
        />
    );
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn(
                "scrollbar-hide gap-2 flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden",
                className,
            )}
            {...props}
        />
    );
}

export function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
    const { toggleSidebar } = useSidebar();
    return (
        <button
            data-slot="sidebar-rail"
            data-sidebar="rail"
            aria-label="Toggle Sidebar"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className={cn(
                "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]/sidebar-wrapper:-right-4 group-data-[side=right]/sidebar-wrapper:-left-4 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]/sidebar-wrapper:after:-right-4 group-data-[side=right]/sidebar-wrapper:after:-left-4 sm:flex",
                "[[data-slot=sidebar]_&]:bg-transparent [[data-slot=sidebar]_&]:hover:bg-transparent",
                className,
            )}
            {...props}
        />
    );
}
