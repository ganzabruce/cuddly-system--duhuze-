"use client";

import { useState } from "react";
import type { Guest } from "@/types/guests";

type UseGuestEditStateOptions = {
  allowEditingNotes?: boolean;
};

function getInitialEditState(guest: Guest | null) {
  return {
    editStatus: (guest?.rsvpStatus ?? "pending") as
      | Guest["rsvpStatus"]
      | "pending",
    editNote: guest?.rsvpNote ?? "",
    editInvitationSent: guest?.invitationSent ?? false,
    editInvitationOpened: guest?.invitationOpened ?? false,
  };
}

export function useGuestEditState(
  guest: Guest | null,
  { allowEditingNotes = true }: UseGuestEditStateOptions = {},
) {
  const initial = getInitialEditState(guest);
  const [editStatus, setEditStatus] = useState<
    Guest["rsvpStatus"] | "pending"
  >(initial.editStatus);
  const [editNote, setEditNote] = useState(initial.editNote);
  const [editInvitationSent, setEditInvitationSent] = useState(
    initial.editInvitationSent,
  );
  const [editInvitationOpened, setEditInvitationOpened] = useState(
    initial.editInvitationOpened,
  );

  const resetFromGuest = (nextGuest: Guest) => {
    const next = getInitialEditState(nextGuest);
    setEditStatus(next.editStatus);
    setEditNote(next.editNote);
    setEditInvitationSent(next.editInvitationSent);
    setEditInvitationOpened(next.editInvitationOpened);
  };

  const buildPayload = (): Partial<Guest> => {
    const normalizedStatus = editStatus === "pending" ? null : editStatus;
    return {
      rsvpStatus: normalizedStatus,
      invitationSent: editInvitationSent,
      invitationOpened: editInvitationOpened,
      ...(allowEditingNotes
        ? { rsvpNote: editNote.trim() ? editNote.trim() : null }
        : {}),
    };
  };

  return {
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
  };
}
