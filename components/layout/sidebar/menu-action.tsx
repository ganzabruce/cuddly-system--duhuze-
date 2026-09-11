"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

const actionClassName = cn(
  "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:bg-sidebar-accent peer-data-[active=true]/menu-button:text-sidebar-accent-foreground absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-6 [&>svg]:shrink-0",
  "after:absolute after:-inset-2 after:md:hidden",
  "peer-data-[size=sm]/menu-button:top-1",
  "peer-data-[size=default]/menu-button:top-1.5",
  "peer-data-[size=lg]/menu-button:top-2.5",
  "group-data-[collapsible=icon]:hidden",
);

export interface SidebarMenuActionProps
  extends useRender.ComponentProps<"button">, React.ComponentProps<"button"> {
  showOnHover?: boolean;
}

export function SidebarMenuAction({
  render,
  showOnHover = false,
  className,
  ...props
}: SidebarMenuActionProps) {
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          actionClassName,
          showOnHover &&
            "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });

  return comp;
}
