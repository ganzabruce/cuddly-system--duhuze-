"use client";

import { GuestTable } from "@/components/guests/event-guests/GuestTable";
import { GuestListToolbar } from "@/components/events/GuestListToolbar";
import { GuestListSelectionBar } from "@/components/events/GuestListSelectionBar";
import { GuestListDialogs } from "@/components/events/GuestListDialogs";
import { useGuestListActions } from "@/hooks/guests/useGuestListActions";
import { DEFAULT_PAGE_SIZE } from "@/components/ui/table-pagination";
import type { GuestListProps } from "@/types/guests";

export function GuestList({
  guests,
  eventName = "event",
  eventId,
  eventSlug,
  eventPublicUrl,
  hour12 = true,
  featureAccess,
  whatsappEnabled,
}: GuestListProps) {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    stats,
    filteredGuests,
    page,
    setPage,
    paginatedGuests,
    selectedIds,
    selectedCount,
    handleSelectionChange,
    handleClearSelection,
    detailGuest,
    isDetailOpen,
    isDetailLoading,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    isBulkDeleteOpen,
    setIsBulkDeleteOpen,
    isBulkDeleting,
    isBulkReminderLoading,
    rowReminderId,
    isBulkInviteLoading,
    pendingCount,
    unsentInviteCount,
    handleExportCsv,
    handleExportExcel,
    handleBulkReminder,
    handleBulkInvite,
    handleRowReminder,
    handleSendRemindersToSelected,
    handleExportSelected,
    handleBulkDeleteGuests,
    handleCopyEmail,
    handleCopyRsvpLink,
    handleOpenGuestDetail,
    handleDetailClose,
    handleDetailSave,
    handleDeleteGuest,
    toggleInvitationSent,
  } = useGuestListActions({
    guests,
    eventName,
    eventId,
    eventSlug,
    eventPublicUrl,
    hour12,
    featureAccess,
  });

  return (
    <>
      <div className="space-y-3">
        <GuestListToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          stats={stats}
          filteredCount={filteredGuests.length}
          csvExportEnabled={featureAccess.csvExport}
          pendingCount={pendingCount}
          unsentInviteCount={unsentInviteCount}
          isBulkInviteLoading={isBulkInviteLoading}
          isBulkReminderLoading={isBulkReminderLoading}
          isBulkDeleting={isBulkDeleting}
          selectedCount={selectedCount}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onBulkInvite={handleBulkInvite}
          onBulkReminder={handleBulkReminder}
          onRequestBulkDelete={() => setIsBulkDeleteOpen(true)}
        />

        <GuestListSelectionBar
          selectedCount={selectedCount}
          isBulkReminderLoading={isBulkReminderLoading}
          isBulkDeleting={isBulkDeleting}
          csvExportEnabled={featureAccess.csvExport}
          onSendReminders={handleSendRemindersToSelected}
          onExportSelected={handleExportSelected}
          onRequestBulkDelete={() => setIsBulkDeleteOpen(true)}
          onClearSelection={handleClearSelection}
        />

        <div className="overflow-hidden rounded-md border border-border">
          <GuestTable
            guests={paginatedGuests}
            rowReminderId={rowReminderId}
            whatsappEnabled={whatsappEnabled}
            selectedGuestIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onOpenDetail={handleOpenGuestDetail}
            onCopyEmail={handleCopyEmail}
            onCopyRsvpLink={handleCopyRsvpLink}
            onRowReminder={handleRowReminder}
            onToggleInvitationSent={toggleInvitationSent}
            onDeleteGuest={setDeleteTarget}
            totalCount={filteredGuests.length}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <GuestListDialogs
        detailGuest={detailGuest}
        isDetailLoading={isDetailLoading}
        isDetailOpen={isDetailOpen}
        onDetailOpenChange={handleDetailClose}
        onDetailSave={handleDetailSave}
        onRequestDetailDelete={setDeleteTarget}
        hour12={hour12}
        whatsappEnabled={whatsappEnabled}
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        onConfirmDelete={handleDeleteGuest}
        onCloseDelete={() => setDeleteTarget(null)}
        isBulkDeleteOpen={isBulkDeleteOpen}
        onBulkDeleteOpenChange={setIsBulkDeleteOpen}
        selectedCount={selectedCount}
        isBulkDeleting={isBulkDeleting}
        onConfirmBulkDelete={handleBulkDeleteGuests}
      />
    </>
  );
}
