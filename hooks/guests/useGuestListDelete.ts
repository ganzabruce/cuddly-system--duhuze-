"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { deleteGuestAction, deleteGuestsBulk } from "@/actions/guests/actions";

type UseGuestListDeleteArgs = {
  removeGuest: (guestId: number) => void;
  detailGuest: Guest | null;
  setDetailGuest: (guest: Guest | null) => void;
  setIsDetailOpen: (open: boolean) => void;
  selectedIds: Set<number>;
  setSelectedIds: (updater: (prev: Set<number>) => Set<number>) => void;
};

/** Single-guest and bulk-delete state and handlers for the event guest list. */
export function useGuestListDelete({
  removeGuest,
  detailGuest,
  setDetailGuest,
  setIsDetailOpen,
  selectedIds,
  setSelectedIds,
}: UseGuestListDeleteArgs) {
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleDeleteGuest = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteGuestAction(deleteTarget.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      removeGuest(deleteTarget.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      if (detailGuest?.id === deleteTarget.id) {
        setDetailGuest(null);
        setIsDetailOpen(false);
      }
      toast.success("Guest removed from the list.");
    } catch {
      toast.error("Unable to delete guest right now.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDeleteGuests = async () => {
    const guestIds = Array.from(selectedIds);
    if (guestIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const result = await deleteGuestsBulk(guestIds);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      guestIds.forEach((id) => removeGuest(id));
      if (detailGuest && selectedIds.has(detailGuest.id)) {
        setDetailGuest(null);
        setIsDetailOpen(false);
      }
      setSelectedIds(() => new Set());
      setIsBulkDeleteOpen(false);
      toast.success(
        guestIds.length === 1
          ? "1 guest removed from the list."
          : `${guestIds.length} guests removed from the list.`,
      );
    } catch {
      toast.error("Unable to delete selected guests right now.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    isBulkDeleteOpen,
    setIsBulkDeleteOpen,
    isBulkDeleting,
    handleDeleteGuest,
    handleBulkDeleteGuests,
  };
}
