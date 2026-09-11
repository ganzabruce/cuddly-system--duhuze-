import ExcelJS from "exceljs";
import { toast } from "sonner";
import type {
  EventExportSummary,
  GuestExportRow,
  AdditionalGuestRow,
} from "@/types/guests";

export type CustomQuestionDef = {
  id: string;
  label: string;
};

export type ExportToExcelOptions = {
  eventSummary: EventExportSummary;
  guests: GuestExportRow[];
  additionalGuests: AdditionalGuestRow[];
  customQuestions: CustomQuestionDef[];
  filenamePrefix?: string;
};

const STATUS_COLORS: Record<string, string> = {
  yes: "FF22C55E",
  maybe: "FFEAB308",
  no: "FFEF4444",
  pending: "FF9CA3AF",
};

function formatDate(value: Date | string | null | undefined, timezone?: string): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value + (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? "T00:00:00" : ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", timezone ? { timeZone: timezone } : undefined);
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  row.alignment = { vertical: "middle", horizontal: "center" };
}

function applyStatusColor(cell: ExcelJS.Cell, status: string | null) {
  const color = STATUS_COLORS[status ?? "pending"];
  if (color) {
    cell.font = { bold: true, color: { argb: color } };
  }
}

export async function exportGuestsToExcel({
  eventSummary,
  guests,
  additionalGuests,
  customQuestions,
  filenamePrefix = "Duhuze-Event-Report",
}: ExportToExcelOptions): Promise<void> {
  if (guests.length === 0) {
    toast.info("There are no guests to export for this view.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Duhuze RSVP";
  workbook.created = new Date();

  // Sheet 1: Event Summary
  const summarySheet = workbook.addWorksheet("Event Summary");
  summarySheet.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 40 },
  ];
  applyHeaderStyle(summarySheet.getRow(1));

  const summaryRows = [
    { field: "Event Name", value: eventSummary.title },
    { field: "Event Date & Time", value: formatDate(eventSummary.date, eventSummary.timezone) },
    { field: "Location", value: eventSummary.locationName },
    { field: "Capacity", value: eventSummary.guestCapacity ?? "Unlimited" },
    { field: "Total Guests (incl. Plus-Ones)", value: eventSummary.totalGuests },
    { field: "Confirmed (Attending)", value: eventSummary.yesCount },
    { field: "Maybe", value: eventSummary.maybeCount },
    { field: "Not Attending", value: eventSummary.noCount },
    { field: "Pending Response", value: eventSummary.pendingCount },
    { field: "Response Rate", value: `${eventSummary.responseRate}%` },
    { field: "Invitations Sent", value: eventSummary.invitationsSent },
    { field: "Invitations Opened", value: eventSummary.invitationsOpened },
    { field: "Open Rate", value: `${eventSummary.openRate}%` },
  ];
  summarySheet.addRows(summaryRows);

  // Sheet 2: Guest Details
  const guestSheet = workbook.addWorksheet("Guest Details");
  const guestHeaders = [
    "Name",
    "Email",
    "Phone",
    "RSVP Status",
    "Plus-Ones Count",
    "Plus-Ones Names",
    ...customQuestions.map((q) => q.label),
    "Attendance Status",
    "Invitation Sent",
    "Invitation Sent At",
    "Invitation Opened",
    "Responded At",
    "RSVP Note",
  ];
  guestSheet.columns = guestHeaders.map((header) => ({
    header,
    key: header.toLowerCase().replace(/\s+/g, "_"),
    width: header.length > 20 ? 25 : 18,
  }));
  applyHeaderStyle(guestSheet.getRow(1));

  for (const guest of guests) {
    const customResponses = customQuestions.map((q) => {
      const response = guest.customQuestionResponses?.[q.id];
      return response ?? "";
    });

    const row = guestSheet.addRow({
      name: guest.name,
      email: guest.email,
      phone: guest.phoneNumber ?? "",
      rsvp_status: guest.rsvpStatus ?? "pending",
      plus_ones_count: guest.additionalGuestCount,
      plus_ones_names: guest.additionalGuestNames,
      ...Object.fromEntries(
        customQuestions.map((q, idx) => [
          q.label.toLowerCase().replace(/\s+/g, "_"),
          customResponses[idx],
        ]),
      ),
      attendance_status: guest.attendanceStatus,
      invitation_sent: guest.invitationSent ? "Yes" : "No",
      invitation_sent_at: formatDate(guest.invitationSentAt, eventSummary.timezone),
      invitation_opened: guest.invitationOpened ? "Yes" : "No",
      responded_at: formatDate(guest.respondedAt, eventSummary.timezone),
      rsvp_note: guest.rsvpNote ?? "",
    });

    const statusCell = row.getCell(4);
    applyStatusColor(statusCell, guest.rsvpStatus);
  }

  // Sheet 3: Additional Guests (only if there are any)
  if (additionalGuests.length > 0) {
    const additionalSheet = workbook.addWorksheet("Additional Guests");
    additionalSheet.columns = [
      { header: "Parent Guest", key: "parent", width: 25 },
      { header: "Plus-One Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Category", key: "category", width: 20 },
      { header: "Order", key: "order", width: 10 },
    ];
    applyHeaderStyle(additionalSheet.getRow(1));

    for (const ag of additionalGuests) {
      additionalSheet.addRow({
        parent: ag.parentGuestName,
        name: ag.name ?? "",
        email: ag.email ?? "",
        category: ag.categoryLabel ?? "",
        order: ag.sortOrder,
      });
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.href = url;
  tempLink.setAttribute(
    "download",
    `${filenamePrefix.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`,
  );
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);

  toast.success(`Exported ${guests.length} guests to Excel.`);
}
