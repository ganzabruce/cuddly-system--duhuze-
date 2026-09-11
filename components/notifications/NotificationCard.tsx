"use client";

import { useEffect, useRef } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import type { NotificationInboxItem } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  item: NotificationInboxItem;
  onOpen: (item: NotificationInboxItem) => void | Promise<void>;
  onSeen?: (item: NotificationInboxItem) => void | Promise<void>;
}

function relativeTimeLabel(isoDate: string): string {
  const createdAt = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - createdAt, 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function NotificationCard({ item, onOpen, onSeen }: NotificationCardProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hasTriggeredSeenRef = useRef(false);

  useEffect(() => {
    if (!onSeen || item.isRead || hasTriggeredSeenRef.current) {
      return;
    }

    const el = buttonRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      hasTriggeredSeenRef.current = true;
      void onSeen(item);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (entry.intersectionRatio < 0.6) return;

        hasTriggeredSeenRef.current = true;
        void onSeen(item);
        observer.disconnect();
      },
      { threshold: [0.6] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [item, onSeen]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50",
        item.isRead
          ? "border-border bg-background"
          : "border-primary/20 bg-primary/5",
      )}
      aria-label={`Open notification: ${item.title}`}
    >
      <div className="relative mt-0.5 shrink-0">
        <BellIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        {!item.isRead && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {item.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {relativeTimeLabel(item.createdAt)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {item.body}
        </p>
      </div>
    </button>
  );
}
