import type { Guest } from "@/types/guests";
import type { EventSummary } from "@/types/guests";
import { useGuestStateBase } from "@/hooks/guests/useGuestStateBase";
import { useGuestFilters } from "@/hooks/guests/useGuestFilters";

export function useGuestState(initialGuests: Guest[], events: EventSummary[]) {
    const { guestState, setGuestState, updateGuest, removeGuest } =
        useGuestStateBase<Guest>(initialGuests);
    const {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        stats,
        filteredGuests,
    } = useGuestFilters(guestState, {
        includeEventSearch: true,
        totalEvents: events.length,
    });

    const updateGuestState = updateGuest;

    return {
        guestState,
        setGuestState,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        stats,
        filteredGuests,
        updateGuestState,
        removeGuest,
    };
}
