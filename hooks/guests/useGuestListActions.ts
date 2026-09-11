"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Guest, GuestListProps } from "@/types/guests";
import { getAppBaseUrl } from "@/lib/utils/url";
import { useGuestStateBase } from "@/hooks/guests/useGuestStateBase";
import { useGuestFilters } from "@/hooks/guests/useGuestFilters";
import { useGuestListEmailActions } from "@/hooks/guests/useGuestListEmailActions";
import { useGuestListExport } from "@/hooks/guests/useGuestListExport";
import { useGuestListDetail } from "@/hooks/guests/useGuestListDetail";
import { useGuestListDelete } from "@/hooks/guests/useGuestListDelete";
import {
  useTablePagination,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/table-pagination";

type UseGuestListActionsArgs = Pick<
  GuestListProps,
  "guests" | "eventName" | "eventId" | "eventSlug" | "eventPublicUrl" | "hour12" | "featureAccess"
>;

/**
 * Owns all state and mutation handlers for the event GuestList: filtering,
 * pagination, selection, and (via sub-hooks) email actions, guest detail,
 * and deletes. Keeps GuestList.tsx and its sibling view components purely
 * presentational.
 */
export function useGuestListActions({
  guests,
  eventName = "event",
  eventId,
  eventSlug,
  eventPublicUrl,
  hour12 = true,
  featureAccess,
}: UseGuestListActionsArgs) {
  const { guestState, updateGuest, removeGuest } =
    useGuestStateBase<Guest>(guests);
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    stats,
    filteredGuests,
  } = useGuestFilters(guestState);

  const { page, setPage, paginate } = useTablePagination<Guest>({
    totalCount: filteredGuests.length,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const paginatedGuests = paginate(filteredGuests);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const handleSelectionChange = useCallback((ids: Set<number>) => {
    setSelectedIds(ids);
  }, []);
  const handleClearSelection = () => setSelectedIds(new Set());
  const selectedCount = selectedIds.size;

  const detail = useGuestListDetail({ updateGuest });

  const email = useGuestListEmailActions({
    guestState,
    updateGuest,
    selectedIds,
    eventId,
  });

  const exportActions = useGuestListExport({
    guestState,
    filteredGuests,
    selectedIds,
    eventId,
    eventName,
    hour12,
    csvExportEnabled: featureAccess.csvExport,
  });

  const del = useGuestListDelete({
    removeGuest,
    detailGuest: detail.detailGuest,
    setDetailGuest: detail.setDetailGuest,
    setIsDetailOpen: detail.setIsDetailOpen,
    selectedIds,
    setSelectedIds,
  });

  const handleCopyEmail = async (emailAddress: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard is not available in this environment.");
      return;
    }
    await navigator.clipboard.writeText(emailAddress);
    toast.success("Email copied to clipboard.");
  };

  const handleCopyRsvpLink = async (guest: Guest) => {
    const baseUrl = getAppBaseUrl();
    const url =
      eventPublicUrl?.trim() ||
      guest.publicUrl ||
      (eventSlug
        ? `${baseUrl}/app/events/${eventSlug}`
        : `${baseUrl}/rsvp`);
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard is not available in this environment.");
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard.");
  };

  return {
    guestState,
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
    handleCopyEmail,
    handleCopyRsvpLink,
    ...detail,
    ...email,
    ...exportActions,
    ...del,
  };
}
