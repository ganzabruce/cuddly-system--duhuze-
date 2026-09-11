import ExcelJS from "exceljs";
import { toast } from "sonner";
import type { EventAnalyticsRow } from "@/types/analytics";

export type AnalyticsExportData = {
  totalEvents: number;
  totalGuests: number;
  overallResponseRate: number;
  totalInvitationsSent: number;
  totalInvitationsOpened: number;
  overallOpenRate: number;
  avgTimeToRespondDays: number | null;
  events: EventAnalyticsRow[];
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  row.alignment = { vertical: "middle", horizontal: "center" };
}

export async function exportAnalyticsToExcel(
  data: AnalyticsExportData,
): Promise<void> {
  if (data.events.length === 0) {
    toast.info("There are no events to export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Duhuze RSVP";
  workbook.created = new Date();

  // Sheet 1: Overall Summary
  const summarySheet = workbook.addWorksheet("Overall Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 },
  ];
  applyHeaderStyle(summarySheet.getRow(1));

  const summaryRows = [
    { metric: "Total Events", value: data.totalEvents },
    { metric: "Total Guests", value: data.totalGuests },
    { metric: "Overall Response Rate", value: `${data.overallResponseRate}%` },
    { metric: "Total Invitations Sent", value: data.totalInvitationsSent },
    { metric: "Total Invitations Opened", value: data.totalInvitationsOpened },
    { metric: "Overall Open Rate", value: `${data.overallOpenRate}%` },
    {
      metric: "Avg Time to Respond (days)",
      value: data.avgTimeToRespondDays?.toFixed(2) ?? "N/A",
    },
  ];
  summarySheet.addRows(summaryRows);

  // Sheet 2: Event Comparison
  const comparisonSheet = workbook.addWorksheet("Event Comparison");
  comparisonSheet.columns = [
    { header: "Event", key: "event", width: 30 },
    { header: "Date", key: "date", width: 15 },
    { header: "Total Guests", key: "total", width: 12 },
    { header: "Confirmed", key: "yes", width: 12 },
    { header: "Maybe", key: "maybe", width: 10 },
    { header: "Not Attending", key: "no", width: 14 },
    { header: "Pending", key: "pending", width: 10 },
    { header: "Response Rate", key: "response", width: 13 },
    { header: "Capacity", key: "capacity", width: 12 },
    { header: "Invitations Sent", key: "sent", width: 15 },
    { header: "Invitations Opened", key: "opened", width: 17 },
    { header: "Open Rate", key: "open", width: 10 },
  ];
  applyHeaderStyle(comparisonSheet.getRow(1));

  for (const event of data.events) {
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    comparisonSheet.addRow({
      event: event.title,
      date: date.toLocaleDateString(),
      total: event.totalGuests,
      yes: event.yesCount,
      maybe: event.maybeCount,
      no: event.noCount,
      pending: event.pendingCount,
      response: `${event.responseRate}%`,
      capacity: event.guestCapacity ?? "Unlimited",
      sent: event.invitationsSent,
      opened: event.invitationsOpened,
      open: `${event.openRate}%`,
    });
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
    `Duhuze-Analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
  );
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);

  toast.success(`Exported analytics for ${data.events.length} events.`);
}
