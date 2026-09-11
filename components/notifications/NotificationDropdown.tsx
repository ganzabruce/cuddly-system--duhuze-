"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getNotificationCountsAction,
  getNotificationsSnapshotAction,
  markNotificationReadAction,
} from "@/actions/notifications/actions";
import type {
  NotificationCounts,
  NotificationFilter,
  NotificationInboxItem,
} from "@/types/notifications";
import { cn } from "@/lib/utils";
import { NotificationCard } from "./NotificationCard";

interface NotificationDropdownProps {
  initialNotifications: NotificationInboxItem[];
  initialCounts: NotificationCounts;
}

const FILTERS: NotificationFilter[] = ["all", "unread", "read"];

export function NotificationDropdown({
  initialNotifications,
  initialCounts,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<NotificationFilter>("all");
  const [open, setOpen] = useState(false);
  const inFlightReadIdsRef = useRef<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  const getItemsForTab = (tab: NotificationFilter): NotificationInboxItem[] =>
    tab === "all"
      ? notifications
      : notifications.filter((item) => (tab === "unread" ? !item.isRead : item.isRead));

  const markAsRead = async (item: NotificationInboxItem): Promise<void> => {
    if (item.isRead) return;
    if (inFlightReadIdsRef.current.has(item.id)) return;

    inFlightReadIdsRef.current.add(item.id);

    setNotifications((prev) =>
      prev.map((candidate) =>
        candidate.id === item.id
          ? {
              ...candidate,
              isRead: true,
              readAt: candidate.readAt ?? new Date().toISOString(),
            }
          : candidate,
      ),
    );
    setCounts((prev) => ({
      all: prev.all,
      unread: Math.max(0, prev.unread - 1),
      read: prev.read + 1,
    }));

    const result = await markNotificationReadAction(item.id);
    inFlightReadIdsRef.current.delete(item.id);

    if (!result.success) {
      const snapshot = await getNotificationsSnapshotAction();
      if (!snapshot.success) return;
      setNotifications(snapshot.notifications);
      setCounts(snapshot.counts);
    }
  };

  const openNotification = async (item: NotificationInboxItem) => {
    if (!item.isRead) {
      await markAsRead(item);
    }

    if (item.link) {
      router.push(item.link);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;

    startTransition(async () => {
      const countsResult = await getNotificationCountsAction();
      if (!countsResult.success) return;

      const serverCounts = countsResult.counts;
      const hasPotentialNewItems =
        serverCounts.all > counts.all || serverCounts.unread !== counts.unread;

      if (!hasPotentialNewItems) {
        setCounts(serverCounts);
        return;
      }

      const snapshot = await getNotificationsSnapshotAction();
      if (!snapshot.success) return;
      setNotifications(snapshot.notifications);
      setCounts(snapshot.counts);
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5" aria-hidden />
        {counts.unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-accent px-1 text-xs font-semibold text-accent-foreground">
            {counts.unread > 99 ? "99+" : counts.unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] border-border bg-card p-3 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <span className="text-xs text-muted-foreground">
            {counts.unread} unread
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationFilter)}>
          <TabsList className="grid w-full grid-cols-3">
            {FILTERS.map((tab) => {
              const value = tab === "all" ? counts.all : tab === "unread" ? counts.unread : counts.read;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={cn("capitalize", tab === "all" && "font-semibold")}
                >
                  {tab} ({value})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {FILTERS.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-3">
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {getItemsForTab(tab).length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-center">
                    <p className="text-sm font-medium text-foreground">No notifications</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tab === "unread"
                        ? "You're all caught up."
                        : "New activity will show up here."}
                    </p>
                  </div>
                ) : (
                  getItemsForTab(tab).map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      onOpen={openNotification}
                      onSeen={markAsRead}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
