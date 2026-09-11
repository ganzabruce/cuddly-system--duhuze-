"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

function PopoverTrigger({ className, ...props }: PopoverPrimitive.Trigger.Props) {
    return <PopoverPrimitive.Trigger className={cn("", className)} {...props} />;
}

function PopoverContent({
    className,
    align = "center",
    side = "bottom",
    sideOffset = 4,
    alignOffset = 0,
    children,
    ...props
}: PopoverPrimitive.Positioner.Props & {
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    alignOffset?: number;
}) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
                className="z-50"
                side={side}
                align={align}
                sideOffset={sideOffset}
                alignOffset={alignOffset}
                {...props}
            >
                <PopoverPrimitive.Popup
                    className={cn(
                        "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-72 rounded-md border p-4 shadow-md outline-none",
                        className
                    )}
                >
                    {children}
                </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
    );
}

export { Popover, PopoverTrigger, PopoverContent };
