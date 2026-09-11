import { useState } from "react";
import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { sendRemindersAction, deleteGuestAction } from "@/actions/guests/actions";
import { copyEmailToClipboard, copyEventLinkToClipboard } from "@/components/guests/client-utils";

type UseGuestActionsProps = {
    updateGuestState: (guestId: number, payload: Partial<Guest>) => void;
    removeGuestFromState: (guestId: number) => void;
    guests: Guest[];
};

export function useGuestActions({
    updateGuestState,
    removeGuestFromState,
    guests,
}: UseGuestActionsProps) {
    const [rowReminderId, setRowReminderId] = useState<number | null>(null);
    const [bulkReminderLoading, setBulkReminderLoading] = useState(false);

    const sendRemindersForGuests = async (guestIds: number[]) => {
        if (guestIds.length === 0) {
            toast.info("No guests selected for reminders.");
            return;
        }

        const guestMap = new Map(guests.map((g) => [g.id, g]));
        const byEvent = new Map<number, number[]>();
        for (const id of guestIds) {
            const guest = guestMap.get(id);
            if (guest?.eventId != null) {
                const list = byEvent.get(guest.eventId) ?? [];
                list.push(id);
                byEvent.set(guest.eventId, list);
            }
        }

        let totalSent = 0;
        let totalFailed = 0;

        for (const [eventId, idsForEvent] of byEvent) {
            const result = await sendRemindersAction(eventId, idsForEvent);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if (result.configError) {
                toast.error(result.message ?? "Email is not configured.");
                return;
            }
            const { sentCount = 0, failedCount = 0, errors } = result.data ?? {};
            totalSent += sentCount;
            totalFailed += failedCount;

            const errorIds = new Set((errors ?? []).map((e) => e.guestId));
            const successfulIds = errorIds.size > 0
                ? idsForEvent.filter((id) => !errorIds.has(id))
                : sentCount > 0 ? idsForEvent : [];
            successfulIds.forEach((id) => {
                updateGuestState(id, { reminderSentAt: new Date().toISOString() });
            });
        }

        if (totalFailed > 0) {
            toast.warning(`Sent ${totalSent} reminder${totalSent === 1 ? "" : "s"}; ${totalFailed} failed.`);
        } else {
            toast.success(`Reminder${totalSent === 1 ? "" : "s"} sent to ${totalSent} guest${totalSent === 1 ? "" : "s"}.`);
        }
    };

    const handleSendReminder = async (guestId: number) => {
        setRowReminderId(guestId);
        try {
            await sendRemindersForGuests([guestId]);
        } finally {
            setRowReminderId(null);
        }
    };

    const handleBulkReminder = async (guestIds: number[]) => {
        setBulkReminderLoading(true);
        try {
            await sendRemindersForGuests(guestIds);
        } finally {
            setBulkReminderLoading(false);
        }
    };

    const handleCopyEmail = async (email: string) => {
        await copyEmailToClipboard(email);
    };

    const handleCopyEventLink = async (eventSlug: string) => {
        await copyEventLinkToClipboard(eventSlug);
    };

    const handleDeleteGuest = async (guestId: number) => {
        const result = await deleteGuestAction(guestId);
        if (result.error) {
            toast.error(result.error);
            return false;
        }
        removeGuestFromState(guestId);
        toast.success("Guest removed from your records.");
        return true;
    };

    return {
        rowReminderId,
        bulkReminderLoading,
        handleSendReminder,
        handleBulkReminder,
        handleCopyEmail,
        handleCopyEventLink,
        handleDeleteGuest,
    };
}
