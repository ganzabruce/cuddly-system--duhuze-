"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSidebar } from "./context";

export function SidebarTrigger({
    className,
    onClick,
    ...props
}: React.ComponentProps<"button">) {
    const { toggleSidebar } = useSidebar();

    return (
        <button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                className,
            )}
            onClick={(event) => {
                onClick?.(event);
                toggleSidebar();
            }}
            {...props}
        >
            <Bars3Icon className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
        </button>
    );
}
