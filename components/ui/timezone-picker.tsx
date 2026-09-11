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
import { getAllTimezones, type TimezoneEntry } from "@/lib/utils/timezones";

interface TimezonePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimezonePicker({
  value,
  onValueChange,
  placeholder = "Select timezone",
  className,
}: TimezonePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const listRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !value) return;
      requestAnimationFrame(() => {
        const el = node.querySelector(`[data-tz="${value}"]`);
        el?.scrollIntoView({ block: "center" });
      });
    },
    [value],
  );

  const timezones = React.useMemo(() => getAllTimezones(), []);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return timezones;
    const q = query.toLowerCase();
    return timezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.id.toLowerCase().includes(q) ||
        tz.offset.toLowerCase().includes(q),
    );
  }, [timezones, query]);

  const selected = React.useMemo(
    () => timezones.find((tz) => tz.id === value),
    [timezones, value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <DropdownMenuTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          className,
        )}
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{selected.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {selected.offset}
            </span>
          </span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 overflow-hidden p-0"
      >
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 px-2">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search timezone…"
              className="h-8 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No timezones found.
            </p>
          ) : (
            filtered.map((tz) => (
              <TimezoneRow
                key={tz.id}
                tz={tz}
                isSelected={value === tz.id}
                onSelect={() => {
                  onValueChange?.(tz.id);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const TimezoneRow = React.memo(function TimezoneRow({
  tz,
  isSelected,
  onSelect,
}: {
  tz: TimezoneEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      data-tz={tz.id}
      className={cn(
        "flex w-full cursor-default items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm",
        isSelected && "bg-surface-raised",
      )}
      onClick={onSelect}
    >
      <span className="truncate">{tz.label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {tz.offset}
      </span>
    </DropdownMenuItem>
  );
});
