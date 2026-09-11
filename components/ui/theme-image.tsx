"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type ThemeImageProps = {
  /** Image source for light mode */
  lightSrc: string;
  /** Image source for dark mode */
  darkSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
};

/**
 * An image component that automatically switches between light and dark variants
 * based on the current theme. Uses CSS-based switching for instant, flicker-free
 * transitions.
 *
 * @example
 * ```tsx
 * import { screenshots } from "@/public";
 * import { ThemeImage } from "@/components/ui/theme-image";
 *
 * <ThemeImage
 *   lightSrc={screenshots.overview.light}
 *   darkSrc={screenshots.overview.dark}
 *   alt="Dashboard screenshot"
 *   width={800}
 *   height={600}
 * />
 * ```
 */
export function ThemeImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  priority,
  width,
  height,
  sizes,
  ...props
}: ThemeImageProps) {
  return (
    <>
      <div className="block dark:hidden">
        <Image
          src={lightSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className={cn("block", className)}
          {...props}
        />
      </div>
      <div className="hidden dark:block">
        <Image
          src={darkSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className={cn("block", className)}
          {...props}
        />
      </div>
    </>
  );
}
