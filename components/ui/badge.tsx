import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "h-5 gap-1 rounded border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-foreground focus-visible:ring-foreground/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background [a]:hover:bg-foreground/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        primary: "bg-accent-tint text-accent-deep border-transparent [a]:hover:bg-accent/20",
        success: "bg-success-surface text-success-deep border-transparent [a]:hover:bg-success/20",
        muted: "bg-muted text-muted-foreground border-transparent [a]:hover:bg-muted/80",
        destructive: "bg-destructive-surface text-destructive-deep [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20",
        warning: "bg-warning-surface text-warning-deep border-transparent [a]:hover:bg-warning/25",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
      },
      size: {
        default: "h-5 px-2 py-0.5",
        sm: "h-4 px-1.5 py-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant, size })),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  })
}

export { Badge, badgeVariants }
