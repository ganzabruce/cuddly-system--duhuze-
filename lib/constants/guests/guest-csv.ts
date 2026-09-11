import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { escapeCsvField, formatDateTime } from "@/lib/utils";

type ExportGuestsCsvOptions = {
  filenamePrefix?: string;
  includeEventColumns?: boolean;
  includeAdditionalGuests?: boolean;
  hour12?: boolean;
};

const DEFAULT_FILENAME = "Duhuze RSVP guests";

function normalizeFilename(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function exportGuestsToCsv(
  guests: Guest[],
  {
    filenamePrefix = DEFAULT_FILENAME,
    includeEventColumns = true,
    includeAdditionalGuests = false,
    hour12 = false,
  }: ExportGuestsCsvOptions = {},
) {
  if (guests.length === 0) {
    toast.info("There are no guests to export for this view.");
    return;
  }

  const headers = ["Name", "Email"];
  if (includeEventColumns) {
    headers.push("Event");
  }
  headers.push("RSVP Status");
  if (includeAdditionalGuests) {
    headers.push("Additional Guests");
  }
  headers.push(
    "Responded At",
    "Invitation Sent",
    "Invitation Opened",
    "Notes",
  );

  const rows = guests.map((guest) => {
    const row: (string | number | null | undefined)[] = [
      guest.name,
      guest.email,
    ];
    if (includeEventColumns) {
      row.push(guest.eventTitle ?? "");
    }
    row.push(guest.rsvpStatus ?? "pending");
    if (includeAdditionalGuests) {
      row.push(guest.additionalGuestCount ?? 0);
    }
    row.push(
      formatDateTime(guest.respondedAt, { hour12 }),
      guest.invitationSent ? "true" : "false",
      guest.invitationOpened ? "true" : "false",
      guest.rsvpNote ?? "",
    );
    return row.map(escapeCsvField);
  });

  const csvContent = [headers.map(escapeCsvField), ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.href = url;
  tempLink.setAttribute("download", `${normalizeFilename(filenamePrefix)}.csv`);
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);

  toast.success(`Exported ${guests.length} guests to CSV.`);
}
