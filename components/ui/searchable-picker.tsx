"use client";

import * as React from "react";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SearchablePickerOption {
  value: string;
  label: React.ReactNode;
  searchTerms: string;
  suffix?: React.ReactNode;
}

interface SearchablePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SearchablePickerOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
}

export function SearchablePicker({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  align = "start",
  className,
  triggerClassName,
}: SearchablePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const listRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !value) return;
      requestAnimationFrame(() => {
        const el = node.querySelector(`[data-picker-value="${value}"]`);
        el?.scrollIntoView({ block: "center" });
      });
    },
    [value],
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.searchTerms.toLowerCase().includes(q));
  }, [options, query]);

  const selected = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <DropdownMenuTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          triggerClassName,
        )}
      >
        {selected ? (
          <span className="inline-flex items-center gap-2 truncate">
            {selected.label}
          </span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("max-h-80 overflow-hidden p-0", className)}
      >
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 px-2">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-8 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((option) => (
              <DropdownMenuItem
                key={option.value}
                data-picker-value={option.value}
                className={cn(
                  "flex w-full cursor-default items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm",
                  value === option.value && "bg-accent/50",
                )}
                onClick={() => {
                  onValueChange?.(option.value);
                  setOpen(false);
                }}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  {option.label}
                </span>
                {option.suffix && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {option.suffix}
                  </span>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
