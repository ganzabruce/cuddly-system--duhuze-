"use client";

import { useState, useMemo } from "react";

import type { AllGuestsClientProps, Guest } from "@/types/guests";
import { GuestDeleteDialog } from "@/components/guests/GuestDeleteDialog";
import { GuestInfoDialog } from "@/components/guests/GuestInfoDialog";
import { GuestStatsCards } from "@/components/guests/GuestStatsCards";
import { GuestTable } from "@/components/guests/GuestTable";
import { GuestBulkActionsMenu } from "@/components/guests/GuestBulkActionsMenu";
import { GuestFilters } from "@/components/guests/GuestFilters";
import type { GuestTableSortColumn } from "@/components/guests/GuestTable";
import { useGuestState } from "@/hooks/guests/useGuestState";
import { useGuestActions } from "@/hooks/guests/useGuestActions";
import { useGuestDetail } from "@/hooks/guests/useGuestDetail";
import { exportGuestsToCSV } from "@/components/guests/client-utils";
import {
    TablePagination,
    useTablePagination,
    DEFAULT_PAGE_SIZE,
} from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_OPTIONS } from "@/lib/constants/guests/guest-status";
import {
    ArrowDownTrayIcon,
    ChevronDownIcon,
    FunnelIcon,
    PaperAirplaneIcon,
    UserMinusIcon,
} from "@heroicons/react/24/outline";

const STATUS_SORT_ORDER: Record<string, number> = {
    pending: 0,
    no: 1,
    maybe: 2,
    yes: 3,
};

function compareGuestsByColumn(
    a: Guest,
    b: Guest,
    column: GuestTableSortColumn,
    direction: "asc" | "desc",
): number {
    const mult = direction === "asc" ? 1 : -1;
    switch (column) {
        case "name":
            return mult * (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
        case "email":
            return mult * (a.email ?? "").localeCompare(b.email ?? "", undefined, { sensitivity: "base" });
        case "event":
            return mult * (a.eventTitle ?? "").localeCompare(b.eventTitle ?? "", undefined, { sensitivity: "base" });
        case "eventDate": {
            const ta = a.eventDate ? new Date(a.eventDate).getTime() : 0;
            const tb = b.eventDate ? new Date(b.eventDate).getTime() : 0;
            return mult * (ta - tb);
        }
        case "status": {
            const sa = a.rsvpStatus ?? "pending";
            const sb = b.rsvpStatus ?? "pending";
            const ra = STATUS_SORT_ORDER[sa] ?? 0;
            const rb = STATUS_SORT_ORDER[sb] ?? 0;
            return mult * (ra - rb);
        }
        default:
            return 0;
    }
}

export function AllGuestsClient({ guests, events, hour12 = true }: AllGuestsClientProps) {
    const {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        stats,
        filteredGuests,
        updateGuestState,
        removeGuest,
    } = useGuestState(guests, events);

    const {
        rowReminderId,
        bulkReminderLoading,
        handleSendReminder,
        handleBulkReminder,
        handleCopyEmail,
        handleCopyEventLink,
        handleDeleteGuest,
    } = useGuestActions({
        updateGuestState,
        removeGuestFromState: removeGuest,
        guests: filteredGuests,
    });

    const {
        detailGuest,
        isSheetOpen,
        editStatus,
        editInvitationSent,
        editInvitationOpened,
        setEditStatus,
        setEditInvitationSent,
        setEditInvitationOpened,
        handleOpenDetail,
        handleSheetChange,
        handleSaveDetail,
        closeDetailSheet,
    } = useGuestDetail({ updateGuestState, allowEditingNotes: false });

    const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);

    // Sort state: column id and direction
    const [sortBy, setSortBy] = useState<GuestTableSortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSortChange = (column: GuestTableSortColumn) => {
        if (sortBy === column) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(column);
            setSortDirection("asc");
        }
    };

    const sortedGuests = useMemo(() => {
        if (!sortBy) return filteredGuests;
        const sorted = [...filteredGuests].sort((a, b) =>
            compareGuestsByColumn(a, b, sortBy, sortDirection),
        );
        return sorted;
    }, [filteredGuests, sortBy, sortDirection]);

    const { page, setPage, paginate } = useTablePagination<Guest>({
        totalCount: sortedGuests.length,
        pageSize: DEFAULT_PAGE_SIZE,
    });
    const paginatedGuests = paginate(sortedGuests);

    const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleExportCSV = () => {
        exportGuestsToCSV(filteredGuests, { hour12 });
    };

    const handleBulkReminderClick = () => {
        const pendingGuestIds = filteredGuests
            .filter((guest) => !guest.respondedAt)
            .map((guest) => guest.id);
        void handleBulkReminder(pendingGuestIds);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const deleted = await handleDeleteGuest(deleteTarget.id);

            // Close detail sheet if this guest was being viewed
            if (deleted && detailGuest?.id === deleteTarget.id) {
                closeDetailSheet();
            }
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleCopyEventLinkWrapper = (guest: Guest) => {
        if (guest.eventSlug) void handleCopyEventLink(guest.eventSlug);
    };

    const handleBulkDeleteConfirm = async () => {
        if (selectedGuestIds.length === 0) return;
        setIsBulkDeleting(true);
        try {
            const failedIds: number[] = [];
            for (const id of selectedGuestIds) {
                const deleted = await handleDeleteGuest(id);
                if (!deleted) {
                    failedIds.push(id);
                }
            }

            if (detailGuest && !failedIds.includes(detailGuest.id)) {
                closeDetailSheet();
            }

            if (failedIds.length === 0) {
                setSelectedGuestIds([]);
                setBulkDeleteOpen(false);
                return;
            }

            setSelectedGuestIds(failedIds);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const pendingCount = filteredGuests.filter(
        (guest) => !guest.respondedAt,
    ).length;
    const bulkActionItems = [
        {
            key: "export",
            label: "Export CSV",
            icon: ArrowDownTrayIcon,
            onSelect: handleExportCSV,
            disabled: filteredGuests.length === 0,
        },
        {
            key: "remind",
            label: bulkReminderLoading ? "Sending..." : "Send Reminders",
            icon: PaperAirplaneIcon,
            onSelect: handleBulkReminderClick,
            disabled: pendingCount === 0 || bulkReminderLoading,
        },
        {
            key: "remove",
            label:
                isBulkDeleting
                    ? "Removing..."
                    : "Remove selected",
            icon: UserMinusIcon,
            onSelect: () =>
                selectedGuestIds.length > 0 && setBulkDeleteOpen(true),
            disabled: selectedGuestIds.length === 0 || isBulkDeleting,
            separatorBefore: true,
        },
    ];

    return (
        <>
            <section className="min-w-0 max-w-full w-full space-y-6 overflow-hidden">
                <GuestStatsCards stats={stats} />

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                        <div className="min-w-0 flex-1 md:max-w-md">
                            <GuestFilters
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                searchPlaceholder="Search by name, email, event, or note"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 md:shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="min-w-36 justify-between gap-2"
                                        />
                                    }
                                >
                                    <FunnelIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {statusFilter === "all"
                                            ? "RSVP Status"
                                            : (() => {
                                                  const option = STATUS_OPTIONS.find(
                                                      (item) =>
                                                          (item.value ?? "pending") === statusFilter,
                                                  );
                                                  if (!option) return "RSVP Status";
                                                  const count =
                                                      statusFilter === "pending"
                                                          ? stats.pending
                                                          : stats[
                                                                statusFilter as keyof typeof stats
                                                            ] ?? 0;
                                                  return `${option.label} (${count})`;
                                              })()}
                                    </span>
                                    <ChevronDownIcon className="h-4 w-4 shrink-0" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem
                                        onClick={() => setStatusFilter("all")}
                                        className={
                                            statusFilter === "all"
                                                ? "bg-accent text-accent-foreground"
                                                : ""
                                        }
                                    >
                                        All Statuses ({stats.total})
                                    </DropdownMenuItem>
                                    {STATUS_OPTIONS.map((option) => {
                                        const value =
                                            (option.value ?? "pending") as typeof statusFilter;
                                        const count =
                                            value === "pending"
                                                ? stats.pending
                                                : stats[value as keyof typeof stats] ?? 0;
                                        return (
                                            <DropdownMenuItem
                                                key={value}
                                                onClick={() => setStatusFilter(value)}
                                                className={
                                                    statusFilter === value
                                                        ? "bg-accent text-accent-foreground"
                                                        : ""
                                                }
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

                    <div className="">
                        <GuestTable
                            guests={paginatedGuests}
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            onSortChange={handleSortChange}
                            onViewDetail={handleOpenDetail}
                            onCopyEmail={handleCopyEmail}
                            onCopyEventLink={handleCopyEventLinkWrapper}
                            onSendReminder={handleSendReminder}
                            onDelete={setDeleteTarget}
                            rowReminderId={rowReminderId}
                            selectedIds={selectedGuestIds}
                            onSelectionChange={setSelectedGuestIds}
                        />
                    </div>

                    <TablePagination
                        totalCount={filteredGuests.length}
                        pageSize={DEFAULT_PAGE_SIZE}
                        page={page}
                        onPageChange={setPage}
                        itemLabel="guests"
                    />
                </div>
            </section>

            {/* Guest Info Dialog */}
            <GuestInfoDialog
                guest={detailGuest}
                isOpen={isSheetOpen}
                onOpenChange={handleSheetChange}
                onSave={handleSaveDetail}
                onDelete={setDeleteTarget}
                onCopyEmail={handleCopyEmail}
                editStatus={editStatus}
                onEditStatusChange={setEditStatus}
                editInvitationSent={editInvitationSent}
                onEditInvitationSentChange={setEditInvitationSent}
                editInvitationOpened={editInvitationOpened}
                onEditInvitationOpenedChange={setEditInvitationOpened}
            />

            {/* Delete Confirmation Dialog (single guest) */}
            <GuestDeleteDialog
                guest={deleteTarget}
                isDeleting={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />

            {/* Bulk delete confirmation */}
            <AlertDialog
                open={bulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedGuestIds.length === 1
                                ? "Remove 1 guest from their event?"
                                : `Remove ${selectedGuestIds.length} guests from their events?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedGuestIds.length === 1
                                ? "This guest will be removed from their event. This action cannot be undone."
                                : "These guests will be removed from their events. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDeleteConfirm}
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? "Removing..." : "Remove"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
