import { FormEvent, useState } from "react";
import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { useGuestEditState } from "@/hooks/guests/useGuestEditState";
import { updateGuestAction } from "@/actions/guests/actions";

type UseGuestDetailProps = {
    updateGuestState: (guestId: number, payload: Partial<Guest>) => void;
    allowEditingNotes?: boolean;
};

export function useGuestDetail({
    updateGuestState,
    allowEditingNotes = true,
}: UseGuestDetailProps) {
    const [detailGuest, setDetailGuest] = useState<Guest | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const {
        editStatus,
        setEditStatus,
        editNote,
        setEditNote,
        editInvitationSent,
        setEditInvitationSent,
        editInvitationOpened,
        setEditInvitationOpened,
        resetFromGuest,
        buildPayload,
    } = useGuestEditState(detailGuest, { allowEditingNotes });

    const handleOpenDetail = (guest: Guest) => {
        setDetailGuest(guest);
        resetFromGuest(guest);
        setIsSheetOpen(true);
    };

    const handleSheetChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setDetailGuest(null);
        }
    };

    const handleSaveDetail = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!detailGuest) return;

        const payload = buildPayload();

        try {
            const result = await updateGuestAction(detailGuest.id, payload);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            updateGuestState(detailGuest.id, payload);
            setDetailGuest((previous) =>
                previous && previous.id === detailGuest.id
                    ? { ...previous, ...payload }
                    : previous,
            );
            toast.success("Guest details updated.");
        } catch {
            toast.error("Unable to update guest");
        }
    };

    const closeDetailSheet = () => {
        setIsSheetOpen(false);
        setDetailGuest(null);
    };

    return {
        detailGuest,
        isSheetOpen,
        editStatus,
        editNote,
        editInvitationSent,
        editInvitationOpened,
        setEditStatus,
        setEditNote,
        setEditInvitationSent,
        setEditInvitationOpened,
        handleOpenDetail,
        handleSheetChange,
        handleSaveDetail,
        closeDetailSheet,
    };
}
