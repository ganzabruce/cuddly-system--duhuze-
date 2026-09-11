"use client";

import { useState } from "react";

/**
 * Shared base hook for guest list state: sync with initial list, update one guest, remove one guest.
 * Used by event-guests (single event) and dashboard all-guests (with filters/stats on top).
 */
export function useGuestStateBase<T extends { id: number }>(initialGuests: T[]) {
    const [guestState, setGuestState] = useState<T[]>(initialGuests);

    // Track initialGuests by identity to detect external changes (e.g., after a mutation)
    const initialKey = JSON.stringify(initialGuests.map((g) => g.id));
    const [prevKey, setPrevKey] = useState(initialKey);
    if (initialKey !== prevKey) {
        setPrevKey(initialKey);
        setGuestState(initialGuests);
    }

    const updateGuest = (guestId: number, payload: Partial<T>) => {
        setGuestState((prev) =>
            prev.map((guest) =>
                guest.id === guestId ? { ...guest, ...payload } : guest,
            ),
        );
    };

    const removeGuest = (guestId: number) => {
        setGuestState((prev) => prev.filter((guest) => guest.id !== guestId));
    };

    return {
        guestState,
        setGuestState,
        updateGuest,
        removeGuest,
    };
}
