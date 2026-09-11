"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestList } from "./GuestList";
import { GuestRowTable } from "./GuestRowTable";
import { CsvImportBar } from "./CsvImportBar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    UserPlusIcon,
} from "@heroicons/react/24/outline";
import { parseGuestsFromFile, validateRow, type RowGuest } from "@/lib/utils/csv-guest-parser";
import { addGuests, sendInvitationsAction } from "@/actions/guests/actions";
import type { Guest } from "@/types/guests";
import type { BillingFeatureAccess } from "@/lib/constants/billing/feature-access";
import { StatCard } from "@/components/layout/StatCard";

interface GuestManagerProps {
  eventGuests: Guest[];
  eventName: string;
  eventId: number;
  eventSlug?: string | null;
  eventPublicUrl?: string | null;
  hour12?: boolean;
  featureAccess: BillingFeatureAccess;
  whatsappEnabled?: boolean;
}

function createEmptyRow(id = "row-1"): RowGuest {
  return { id, name: "", email: "", phoneNumber: "" };
}

function hasOnlyPristinePlaceholderRow(rows: RowGuest[]): boolean {
  if (rows.length !== 1) return false;

  const [row] = rows;
  return (
    row.name.trim() === "" &&
    row.email.trim() === ""
  );
}

function formatSkipSummary(invalidRowCount: number, duplicateCount: number): string {
  const parts: string[] = [];

  if (invalidRowCount > 0) {
    parts.push(
      `Skipped ${invalidRowCount} invalid row${invalidRowCount === 1 ? "" : "s"}`,
    );
  }

  if (duplicateCount > 0) {
    parts.push(
      `Skipped ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}`,
    );
  }

  return parts.length > 0 ? `${parts.join(". ")}.` : "";
}

export function GuestManager({
  eventGuests,
  eventName,
  eventId,
  eventSlug,
  eventPublicUrl,
  hour12 = true,
  featureAccess,
  whatsappEnabled = false,
}: GuestManagerProps) {
  const [showAddGuests, setShowAddGuests] = useState(false);
  const [rows, setRows] = useState<RowGuest[]>([createEmptyRow()]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sendInvites, setSendInvites] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasImportedCsv, setHasImportedCsv] = useState(false);
  const router = useRouter();

  const validatedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      error: hasSubmitted ? validateRow(row, { phoneAllowed: whatsappEnabled }) : undefined,
    }));
  }, [rows, hasSubmitted, whatsappEnabled]);

  const validGuests = validatedRows.filter((g) => !g.error);
  const invalidGuests = validatedRows.filter((g) => g.error);

  const resetDialog = () => {
    setRows([createEmptyRow()]);
    setSendInvites(true);
    setHasSubmitted(false);
    setHasImportedCsv(false);
  };

  const importFromCsvFile = async (file: File) => {
    const parsed = await parseGuestsFromFile(file);
    if (parsed.length === 0) {
      toast.error("No rows found in the CSV.");
      return;
    }
    const importIdPrefix = `csv-${Date.now()}`;
    const importedRows = parsed.map((guest, index) => ({
      id: `${importIdPrefix}-${index}`,
      ...guest,
    }));

    setRows((prev) => {
      setHasImportedCsv(true);
      if (hasOnlyPristinePlaceholderRow(prev)) {
        return importedRows;
      }

      return [...prev, ...importedRows];
    });
  };

  const handleRowUpdate = (id: string, field: "name" | "email" | "phoneNumber", value: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleRowRemove = (id: string) => {
    setRows((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddGuests = async () => {
    setHasSubmitted(true);
    const submittedRows = rows.map((row) => ({
      ...row,
      error: validateRow(row, { phoneAllowed: whatsappEnabled }),
    }));
    const guestsToSubmit = submittedRows
      .filter((row) => !row.error);
    const invalidRowCount = submittedRows.length - guestsToSubmit.length;

    if (invalidRowCount > 0) {
      toast.info(
        `${invalidRowCount} invalid row${invalidRowCount === 1 ? "" : "s"} will be skipped.`,
      );
    }

    if (guestsToSubmit.length === 0) {
      toast.error("Add at least one valid guest.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addGuests({
        eventId,
        source: hasImportedCsv ? "csv_import" : "manual",
        guests: guestsToSubmit.map(({ name, email, phoneNumber }) => ({
          name,
          email: email.trim() ? email.toLowerCase() : undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          rsvpStatus: null,
        })),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const created = result.data?.created ?? [];
      const createdCount = created.length;
      const duplicateCount = result.data?.skipped ?? 0;
      const skipSummary = formatSkipSummary(invalidRowCount, duplicateCount);
      const addedSummary = `Added ${createdCount} guest${createdCount === 1 ? "" : "s"}.`;

      if (sendInvites && createdCount > 0) {
        const inviteResult = await sendInvitationsAction(
          eventId,
          created.map((guest) => guest.id),
        );
        if (inviteResult.error) {
          toast.error(inviteResult.error);
        } else if (inviteResult.configError) {
          toast.error(
            inviteResult.message ??
              "Email is not configured. Add RESEND_API_KEY to your environment to send emails.",
          );
        } else if (inviteResult.data && inviteResult.data.failedCount > 0) {
          const reason =
            inviteResult.data.errors?.[0]?.error ?? "Some invites failed";
          toast.warning(
            `${addedSummary} ${skipSummary} Sent ${inviteResult.data.sentCount} invite${inviteResult.data.sentCount === 1 ? "" : "s"}; ${inviteResult.data.failedCount} failed. ${reason}`.trim(),
          );
        } else {
          const sentCount = inviteResult.data?.sentCount ?? 0;
          toast.success(
            `${addedSummary} ${skipSummary} Sent ${sentCount} invite${sentCount === 1 ? "" : "s"}.`.trim(),
          );
        }
      } else {
        toast.success(
          `${addedSummary} ${skipSummary}`.trim(),
        );
      }

      resetDialog();
      setShowAddGuests(false);
      router.refresh();
    } catch {
      toast.error("Unable to add guests.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      resetDialog();
    }
    setShowAddGuests(open);
  };

  return (
    <section className="space-y-5 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-2xl">Guest management</h2>
          <p className="text-sm text-muted-foreground">
            Search, filter, export, and send reminders in one place.
            {(!featureAccess.csvImport || !featureAccess.csvExport) && (
              <span className="ml-1 text-xs opacity-70">CSV import and export require a higher plan.</span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowAddGuests(true)} size="sm" className="w-full shrink-0 gap-1.5 sm:w-auto">
          <UserPlusIcon className="h-4 w-4" />
          Add guests
        </Button>
      </div>

      {eventGuests.length > 0 && (() => {
        const yes = eventGuests.filter((g) => g.rsvpStatus === "yes").length;
        const no = eventGuests.filter((g) => g.rsvpStatus === "no").length;
        const maybe = eventGuests.filter((g) => g.rsvpStatus === "maybe").length;
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard title="Total" value={eventGuests.length} />
            <StatCard title="Going" value={yes} variant="success" />
            <StatCard title="Maybe" value={maybe} variant="warning" />
            <StatCard title="Declined" value={no} variant="destructive" />
          </div>
        );
      })()}

      <GuestList
        guests={eventGuests}
        eventName={eventName}
        eventId={eventId}
        eventSlug={eventSlug}
        eventPublicUrl={eventPublicUrl}
        hour12={hour12}
        featureAccess={featureAccess}
        whatsappEnabled={whatsappEnabled}
      />

      <Dialog open={showAddGuests} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add guests</DialogTitle>
            <DialogDescription className="hidden sm:block">
              Add guests manually or import a CSV file with name, email and phone columns.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="hidden sm:block">
              <CsvImportBar
                validCount={validGuests.length}
                invalidCount={invalidGuests.length}
                onImportFile={importFromCsvFile}
                isSubmitting={isSubmitting}
                enabled={featureAccess.csvImport}
              />
            </div>

            <GuestRowTable
              rows={validatedRows}
              onUpdate={handleRowUpdate}
              onRemove={handleRowRemove}
              disabled={rows.length === 1}
              showPhoneNumber={whatsappEnabled}
              onAddRow={() =>
                setRows((prev) => [
                  ...prev,
                  createEmptyRow(`row-${Date.now()}`),
                ])
              }
            />
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={sendInvites} onCheckedChange={setSendInvites} />
                <span className="text-xs text-muted-foreground">Send invitations after adding</span>
              </div>
              <div className="flex flex-row gap-2 items-center w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddGuests}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  {isSubmitting ? "Adding..." : "Add guests"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
