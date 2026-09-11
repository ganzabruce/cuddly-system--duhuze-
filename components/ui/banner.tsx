"use client";

import { useState, useSyncExternalStore } from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ButtonVariantProps } from "@/components/ui/button-variants";

const bannerVariants = cva(
  "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 overflow-hidden px-3 py-2 text-xs transition-[padding,height,opacity] sm:flex-nowrap sm:px-6 sm:py-2.5 sm:text-sm",
  {
    variants: {
      variant: {
        default: "bg-sidebar text-sidebar-foreground",
        accent: "bg-accent text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const BANNER_STORAGE_EVENT = "duhuze:banner-storage";

function readDismissedState(storageKey?: string) {
  if (!storageKey || typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(storageKey) === "dismissed";
  } catch {
    return false;
  }
}

function useStoredDismissedState(storageKey?: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!storageKey || typeof window === "undefined") return () => {};

      window.addEventListener("storage", onStoreChange);
      window.addEventListener(BANNER_STORAGE_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(BANNER_STORAGE_EVENT, onStoreChange);
      };
    },
    () => readDismissedState(storageKey),
    () => false,
  );
}

function Banner({
  className,
  variant,
  storageKey,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof bannerVariants> & { storageKey?: string }) {
  const [locallyDismissed, setLocallyDismissed] = useState(false);
  const storedDismissed = useStoredDismissedState(storageKey);

  function dismiss() {
    setLocallyDismissed(true);

    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "dismissed");
        window.dispatchEvent(new Event(BANNER_STORAGE_EVENT));
      } catch {
        // The local state above still hides the banner when storage is unavailable.
      }
    }
  }

  if (locallyDismissed || storedDismissed) return null;

  return (
    <div data-slot="banner" className={cn(bannerVariants({ variant }), className)} {...props}>
      <p data-slot="banner-text" className="min-w-0 flex-1 text-center text-xs/5 sm:text-sm/6">
        {children}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label="Dismiss"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
        >
          <path
            fillRule="evenodd"
            d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

function BannerAction({
  className,
  size,
  variant,
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  return (
    <Button
      data-slot="banner-action"
      variant={variant ?? "link"}
      size={size ?? "sm"}
      className={cn("shrink-0 text-inherit underline", className)}
      {...props}
    />
  );
}

export { Banner, BannerAction, bannerVariants };
