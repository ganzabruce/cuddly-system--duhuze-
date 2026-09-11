"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import {
  sendInvitationsAction,
  sendRemindersAction,
} from "@/actions/guests/actions";

type UseGuestListEmailActionsArgs = {
  guestState: Guest[];
  updateGuest: (guestId: number, payload: Partial<Guest>) => void;
  selectedIds: Set<number>;
  eventId: number;
};

/**
 * Bulk and row-level invite/reminder email actions for the event guest list.
 */
export function useGuestListEmailActions({
  guestState,
  updateGuest,
  selectedIds,
  eventId,
}: UseGuestListEmailActionsArgs) {
  const [isBulkReminderLoading, setIsBulkReminderLoading] = useState(false);
  const [rowReminderId, setRowReminderId] = useState<number | null>(null);
  const [isBulkInviteLoading, setIsBulkInviteLoading] = useState(false);

  const sendReminders = async (guestIds: number[], isRowAction = false) => {
    if (guestIds.length === 0) {
      toast.info("No guests selected for reminders.");
      return;
    }

    if (isRowAction) {
      setRowReminderId(guestIds[0]);
    } else {
      setIsBulkReminderLoading(true);
    }

    try {
      const result = await sendRemindersAction(eventId, guestIds);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.configError) {
        toast.error(result.message ?? "Email is not configured.");
        return;
      }
      const { sentCount = 0, failedCount = 0, errors } = result.data ?? {};
      const errorIds = new Set((errors ?? []).map((e) => e.guestId));
      const successfulIds =
        errorIds.size > 0
          ? guestIds.filter((id) => !errorIds.has(id))
          : guestIds;
      successfulIds.forEach((id) => {
        updateGuest(id, {
          invitationSent: true,
          invitationSentAt: new Date(),
        });
      });
      if (failedCount > 0) {
        toast.warning(
          `Sent ${sentCount} reminder${sentCount === 1 ? "" : "s"}; ${failedCount} failed.`,
        );
      } else {
        toast.success(
          `Reminder${sentCount === 1 ? "" : "s"} sent to ${sentCount} guest${sentCount === 1 ? "" : "s"}.`,
        );
      }
    } catch {
      toast.error("Unable to send reminders. Please try again.");
    } finally {
      if (isRowAction) {
        setRowReminderId(null);
      } else {
        setIsBulkReminderLoading(false);
      }
    }
  };

  const handleBulkReminder = () => {
    const pendingGuests = guestState
      .filter((guest) => !guest.respondedAt)
      .map((guest) => guest.id);
    void sendReminders(pendingGuests);
  };

  const handleRowReminder = (guestId: number) => {
    void sendReminders([guestId], true);
  };

  const handleSendRemindersToSelected = () => {
    const ids = Array.from(selectedIds);
    void sendReminders(ids);
  };

  const handleBulkInvite = async () => {
    const unsentIds = guestState
      .filter((g) => !g.invitationSent)
      .map((g) => g.id);
    if (unsentIds.length === 0) {
      toast.info("All guests have already been sent an invite.");
      return;
    }
    setIsBulkInviteLoading(true);
    try {
      const result = await sendInvitationsAction(eventId, unsentIds);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.configError) {
        toast.error(result.message ?? "Email is not configured.");
        return;
      }
      const { sentCount = 0, failedCount = 0, errors } = result.data ?? {};
      const errorIds = new Set((errors ?? []).map((e) => e.guestId));
      const successfulIds =
        errorIds.size > 0
          ? unsentIds.filter((id) => !errorIds.has(id))
          : unsentIds;
      successfulIds.forEach((id) => {
        updateGuest(id, {
          invitationSent: true,
          invitationSentAt: new Date(),
        });
      });
      if (failedCount > 0) {
        const reason = errors?.[0]?.error ?? "Unknown error";
        toast.warning(
          `Sent ${sentCount} invite${sentCount === 1 ? "" : "s"}; ${failedCount} failed. ${reason}`,
        );
      } else {
        toast.success(
          `Invite${sentCount === 1 ? "" : "s"} sent to ${sentCount} guest${sentCount === 1 ? "" : "s"}.`,
        );
      }
    } catch {
      toast.error("Unable to send invites.");
    } finally {
      setIsBulkInviteLoading(false);
    }
  };

  const pendingCount = guestState.filter((g) => !g.respondedAt).length;
  const unsentInviteCount = guestState.filter((g) => !g.invitationSent).length;

  return {
    isBulkReminderLoading,
    rowReminderId,
    isBulkInviteLoading,
    pendingCount,
    unsentInviteCount,
    handleBulkReminder,
    handleRowReminder,
    handleSendRemindersToSelected,
    handleBulkInvite,
  };
}
