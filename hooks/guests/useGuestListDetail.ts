"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { getGuestDetail, updateGuestAction } from "@/actions/guests/actions";

type UseGuestListDetailArgs = {
  updateGuest: (guestId: number, payload: Partial<Guest>) => void;
};

/** Guest detail sheet state: opening, loading, saving, and the invitation-sent toggle. */
export function useGuestListDetail({ updateGuest }: UseGuestListDetailArgs) {
  const [detailGuest, setDetailGuest] = useState<Guest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const latestGuestIdRef = useRef<number | null>(null);

  const handleOpenGuestDetail = async (guest: Guest) => {
    latestGuestIdRef.current = guest.id;
    setDetailGuest(guest);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const result = await getGuestDetail(guest.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (latestGuestIdRef.current === guest.id && result.data) {
        setDetailGuest(result.data as Guest);
      }
    } catch {
      toast.error("Unable to load guest details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDetailClose = (open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setDetailGuest(null);
      setIsDetailLoading(false);
    }
  };

  const handleDetailSave = async (updatedGuest: Partial<Guest>) => {
    if (!detailGuest) return;
    if (Object.keys(updatedGuest).length === 0) return;

    try {
      const result = await updateGuestAction(detailGuest.id, updatedGuest);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const savedGuest = (result.data ?? updatedGuest) as Partial<Guest>;
      updateGuest(detailGuest.id, savedGuest);
      setDetailGuest((previous) =>
        previous ? { ...previous, ...savedGuest } : previous,
      );
      toast.success("Guest details updated.");
    } catch {
      toast.error("Unable to update guest");
    }
  };

  const toggleInvitationSent = async (guest: Guest) => {
    const nextValue = !guest.invitationSent;
    try {
      const result = await updateGuestAction(guest.id, {
        invitationSent: nextValue,
        invitationOpened: guest.invitationOpened,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      updateGuest(guest.id, {
        invitationSent: nextValue,
        invitationSentAt: nextValue ? new Date() : null,
      });
      toast.success(
        nextValue
          ? "Marked invitation as sent."
          : "Invitation marked as not sent.",
      );
    } catch {
      toast.error("Unable to update guest");
    }
  };

  return {
    detailGuest,
    setDetailGuest,
    isDetailOpen,
    setIsDetailOpen,
    isDetailLoading,
    handleOpenGuestDetail,
    handleDetailClose,
    handleDetailSave,
    toggleInvitationSent,
  };
}
