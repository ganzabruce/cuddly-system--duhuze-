"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "@heroicons/react/24/outline"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "border-border bg-transparent data-checked:bg-primary data-checked:text-primary-foreground data-checked:border-primary focus-visible:border-primary focus-visible:ring-primary/20 flex size-4 items-center justify-center rounded border-2 transition-all duration-200 group-has-disabled/field:opacity-50 focus-visible:ring-[3px] peer relative shrink-0 outline-none cursor-pointer hover:border-border disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="[&>svg]:size-3 grid place-content-center text-current animate-in zoom-in-50 duration-150"
      >
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
