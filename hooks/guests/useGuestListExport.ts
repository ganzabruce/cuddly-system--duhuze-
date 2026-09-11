"use client";

import { toast } from "sonner";
import type { Guest, EventExport } from "@/types/guests";
import { exportGuestsToCsv } from "@/lib/constants/guests/guest-csv";
import { exportGuestsToExcel } from "@/lib/services/guests/guest-excel";

type UseGuestListExportArgs = {
  guestState: Guest[];
  filteredGuests: Guest[];
  selectedIds: Set<number>;
  eventId: number;
  eventName: string;
  hour12: boolean;
  csvExportEnabled: boolean;
};

/**
 * CSV/Excel export handlers for the event guest list.
 */
export function useGuestListExport({
  guestState,
  filteredGuests,
  selectedIds,
  eventId,
  eventName,
  hour12,
  csvExportEnabled,
}: UseGuestListExportArgs) {
  const handleExportCsv = () => {
    if (!csvExportEnabled) {
      toast.error("Your current plan does not allow access to CSV export.");
      return;
    }

    exportGuestsToCsv(filteredGuests, {
      filenamePrefix: eventName,
      includeEventColumns: false,
      includeAdditionalGuests: true,
      hour12,
    });
  };

  const handleExportExcel = async () => {
    if (!csvExportEnabled) {
      toast.error("Your current plan does not allow access to Excel export.");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/export`);
      if (!res.ok) {
        throw new Error("Failed to fetch export data");
      }
      const data: EventExport = await res.json();
      await exportGuestsToExcel({
        eventSummary: data.eventSummary,
        guests: data.guests,
        additionalGuests: data.additionalGuests,
        customQuestions: data.customQuestions,
        filenamePrefix: eventName,
      });
    } catch {
      toast.error("Unable to export to Excel. Please try again.");
    }
  };

  const handleExportSelected = () => {
    if (!csvExportEnabled) {
      toast.error("Your current plan does not allow access to CSV export.");
      return;
    }
    const toExport = guestState.filter((g) => selectedIds.has(g.id));
    exportGuestsToCsv(toExport, {
      filenamePrefix: eventName,
      includeEventColumns: false,
      includeAdditionalGuests: true,
      hour12,
    });
  };

  return {
    handleExportCsv,
    handleExportExcel,
    handleExportSelected,
  };
}
