import { cva, type VariantProps } from "class-variance-authority";

const base =
  "peer/menu-button flex w-full items-center overflow-hidden outline-hidden group/menu-button gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors";

const focusRing = "ring-sidebar-ring focus-visible:ring-2";

const interaction =
  "cursor-pointer text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-foreground";

const disabled =
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const collapsed =
  "group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center";

const activeState =
  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold";

const content =
  "[&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0 group-data-[collapsible=icon]:[&_svg]:size-5";

const variantStyles = {
  default: "",
  outline:
    "bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ring-1 ring-sidebar-border hover:ring-sidebar-accent",
} as const;

const sizeStyles = {
  default: "h-9 text-sm",
  sm: "h-8 text-sm",
  lg: "h-10 text-sm group-data-[collapsible=icon]:p-0!",
} as const;

export const sidebarMenuButtonVariants = cva(
  [
    base,
    focusRing,
    interaction,
    disabled,
    collapsed,
    activeState,
    content,
  ].join(" "),
  {
    variants: {
      variant: variantStyles,
      size: sizeStyles,
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type SidebarMenuButtonVariants = VariantProps<
  typeof sidebarMenuButtonVariants
>;
