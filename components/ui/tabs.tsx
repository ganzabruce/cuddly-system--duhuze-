"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
    React.ComponentRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
        variant?: "default" | "line";
    }
>(({ className, variant = "default", ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            variant === "line"
                ? "inline-flex items-center justify-start border-b border-border text-xs text-muted-foreground"
                : "inline-flex items-center justify-center rounded-md bg-muted p-1 text-xs text-muted-foreground",
            className,
        )}
        {...props}
    />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Tab>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab> & {
        variant?: "default" | "line";
    }
>(({ className, variant = "default", ...props }, ref) => (
    <TabsPrimitive.Tab
        ref={ref}
        className={cn(
            variant === "line"
                ? [
                      "inline-flex cursor-pointer items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-xs font-medium transition-colors",
                      "text-muted-foreground hover:text-foreground",
                      "data-[active]:border-primary data-[active]:text-foreground",
                  ]
                : [
                      "inline-flex cursor-pointer items-center justify-center rounded-md border text-xs font-medium transition-all duration-150",
                      "border-transparent bg-transparent text-muted-foreground/80 px-3 py-1.5",
                      "hover:text-foreground",
                      "data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:border-primary",
                  ],
            className,
        )}
        {...props}
    />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Panel>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Panel
        ref={ref}
        className={cn("mt-2 focus-visible:outline-none", className)}
        {...props}
    />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

