"use client";

import { useMemo } from "react";
import * as flags from "country-flag-icons/string/3x2";
import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code: string;
  className?: string;
};

const flagMap = flags as Record<string, string>;

export function CountryFlag({ code, className }: CountryFlagProps) {
  const svg = useMemo(() => flagMap[code.toUpperCase()], [code]);

  if (!svg) return null;

  return (
    <span
      className={cn("inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
