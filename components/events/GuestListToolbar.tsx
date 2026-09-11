"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GuestBulkActionsMenu } from "@/components/guests/GuestBulkActionsMenu";
import { GuestFilters } from "@/components/guests/GuestFilters";
import { STATUS_OPTIONS } from "@/lib/constants/guests/guest-status";
import type { Guest, GuestStats } from "@/types/guests";

type StatusFilter = Guest["rsvpStatus"] | "all" | "pending";

type GuestListToolbarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  stats: GuestStats;
  filteredCount: number;
  csvExportEnabled: boolean;
  pendingCount: number;
  unsentInviteCount: number;
  isBulkInviteLoading: boolean;
  isBulkReminderLoading: boolean;
  isBulkDeleting: boolean;
  selectedCount: number;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onBulkInvite: () => void;
  onBulkReminder: () => void;
  onRequestBulkDelete: () => void;
};

/** Search box, status filter dropdown, and bulk actions menu for the event guest list. */
export function GuestListToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  stats,
  filteredCount,
  csvExportEnabled,
  pendingCount,
  unsentInviteCount,
  isBulkInviteLoading,
  isBulkReminderLoading,
  isBulkDeleting,
  selectedCount,
  onExportCsv,
  onExportExcel,
  onBulkInvite,
  onBulkReminder,
  onRequestBulkDelete,
}: GuestListToolbarProps) {
  const bulkActionItems = [
    {
      key: "export",
      label: "Export CSV",
      icon: ArrowDownTrayIcon,
      onSelect: onExportCsv,
      disabled: filteredCount === 0 || !csvExportEnabled,
    },
    {
      key: "export-excel",
      label: "Export Excel",
      icon: ArrowDownTrayIcon,
      onSelect: onExportExcel,
      disabled: filteredCount === 0 || !csvExportEnabled,
    },
    {
      key: "invite",
      label: isBulkInviteLoading ? "Sending..." : "Send Invites",
      icon: EnvelopeIcon,
      onSelect: onBulkInvite,
      disabled: unsentInviteCount === 0 || isBulkInviteLoading,
    },
    {
      key: "remind",
      label: isBulkReminderLoading ? "Sending..." : "Send Reminders",
      icon: PaperAirplaneIcon,
      onSelect: onBulkReminder,
      disabled: pendingCount === 0 || isBulkReminderLoading,
    },
    {
      key: "remove",
      label: isBulkDeleting ? "Removing..." : "Remove selected",
      icon: TrashIcon,
      onSelect: onRequestBulkDelete,
      disabled: selectedCount === 0 || isBulkDeleting,
      destructive: true,
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1 md:max-w-md">
        <GuestFilters searchTerm={searchTerm} onSearchChange={onSearchChange} />
      </div>

      <div className="flex items-center justify-end gap-2 md:shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-40 justify-between gap-1.5 text-xs"
              />
            }
          >
            <FunnelIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-left">
              {statusFilter === "all"
                ? `All guests (${stats.total})`
                : (() => {
                    const opt = STATUS_OPTIONS.find(
                      (o) => (o.value ?? "pending") === statusFilter,
                    );
                    if (!opt) return "All guests";
                    const count =
                      statusFilter === "pending"
                        ? stats.pending
                        : stats[statusFilter as keyof typeof stats] ?? 0;
                    return `${opt.label} (${count})`;
                  })()}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onStatusFilterChange("all")}
              className={statusFilter === "all" ? "bg-accent text-accent-foreground" : ""}
            >
              All guests ({stats.total})
            </DropdownMenuItem>
            {STATUS_OPTIONS.map((option) => {
              const value = (option.value ?? "pending") as StatusFilter;
              const count =
                value === "pending"
                  ? stats.pending
                  : stats[value as keyof typeof stats] ?? 0;
              return (
                <DropdownMenuItem
                  key={value}
                  onClick={() => onStatusFilterChange(value)}
                  className={statusFilter === value ? "bg-accent text-accent-foreground" : ""}
                >
                  {option.label} ({count})
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <GuestBulkActionsMenu items={bulkActionItems} />
      </div>
    </div>
  );
}
