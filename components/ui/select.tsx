"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon>
                <ChevronDownIcon className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-open:rotate-180" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner side="bottom" align="start" sideOffset={4} className="isolate z-[200] outline-none w-[var(--anchor-width)]">
                <SelectPrimitive.Popup
                    className={cn(
                        "relative max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                        className,
                    )}
                    {...props}
                >
                    <SelectPrimitive.List className={cn("p-1")}>
                        {children}
                    </SelectPrimitive.List>
                </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
    return (
        <SelectPrimitive.GroupLabel
            className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
            {...props}
        />
    );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
    return (
        <SelectPrimitive.Item
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-highlighted:bg-surface-raised data-highlighted:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
            </span>

            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

const SelectSeparator = ({ className, ...props }: React.ComponentPropsWithoutRef<"div">) => (
    <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
);

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
};
