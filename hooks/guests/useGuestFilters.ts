"use client";

import { useMemo, useState } from "react";
import type { Guest, GuestStats } from "@/types/guests";

type UseGuestFiltersOptions = {
  includeEventSearch?: boolean;
  totalEvents?: number;
};

export function useGuestFilters(
  guests: Guest[],
  { includeEventSearch = false, totalEvents }: UseGuestFiltersOptions = {},
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Guest["rsvpStatus"] | "all" | "pending"
  >("all");

  const stats: GuestStats = useMemo(() => {
    const yes = guests.filter((guest) => guest.rsvpStatus === "yes").length;
    const no = guests.filter((guest) => guest.rsvpStatus === "no").length;
    const maybe = guests.filter((guest) => guest.rsvpStatus === "maybe").length;
    const pending = guests.filter((guest) => !guest.rsvpStatus).length;

    return {
      total: guests.length,
      yes,
      no,
      maybe,
      pending,
      totalEvents,
    };
  }, [guests, totalEvents]);

  const filteredGuests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return guests
      .filter((guest) => {
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "pending"
              ? guest.rsvpStatus === null
              : guest.rsvpStatus === statusFilter;

        const matchesSearch =
          term.length === 0 ||
          guest.name.toLowerCase().includes(term) ||
          (guest.email?.toLowerCase().includes(term) ?? false) ||
          (guest.phoneNumber?.toLowerCase().includes(term) ?? false) ||
          guest.rsvpNote?.toLowerCase().includes(term) ||
          (includeEventSearch
            ? guest.eventTitle?.toLowerCase().includes(term) ?? false
            : false);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (!a.respondedAt && !b.respondedAt) return 0;
        if (!a.respondedAt) return 1;
        if (!b.respondedAt) return -1;
        return (
          new Date(b.respondedAt).getTime() -
          new Date(a.respondedAt).getTime()
        );
      });
  }, [guests, includeEventSearch, searchTerm, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    stats,
    filteredGuests,
  };
}
