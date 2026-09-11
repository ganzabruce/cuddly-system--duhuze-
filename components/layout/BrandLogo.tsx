"use client";

import Image from "next/image";
import { brandLogos } from "@/public";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  mode?: "auto" | "light" | "dark";
  priority?: boolean;
};

export function BrandLogo({
  alt = "Duhuze RSVP",
  className,
  mode = "auto",
  priority,
}: BrandLogoProps) {
  const sizeClass = className ?? "h-12 w-auto";

  if (mode === "light") {
    return (
      <Image
        src={brandLogos.wordmarkLight}
        alt={alt}
        priority={priority}
        unoptimized
        width={300}
        height={48}
        className={sizeClass}
      />
    );
  }

  if (mode === "dark") {
    return (
      <Image
        src={brandLogos.wordmarkDark}
        alt={alt}
        priority={priority}
        unoptimized
        width={300}
        height={48}
        className={sizeClass}
      />
    );
  }

  return (
    <>
      <Image
        src={brandLogos.wordmarkLight}
        alt={alt}
        priority={priority}
        unoptimized
        width={300}
        height={48}
        className={`block dark:hidden ${sizeClass}`}
      />
      <Image
        src={brandLogos.wordmarkDark}
        alt={alt}
        priority={priority}
        unoptimized
        width={300}
        height={48}
        className={`hidden dark:block ${sizeClass}`}
      />
    </>
  );
}
