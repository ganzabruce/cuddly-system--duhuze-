"use client";

import { useState } from "react";
import {
    CheckIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Guest } from "@/types/guests";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { STATUS_OPTIONS } from "@/lib/constants/guests/guest-status";
import { useGuestEditState } from "@/hooks/guests/useGuestEditState";
import { formatCurrency } from "@/lib/utils/format";
import { formatDateTime } from "@/lib/utils";

type GuestDetailSheetProps = {
    guest: Guest | null;
    isLoading?: boolean;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updatedGuest: Partial<Guest>) => void;
    allowEditingNotes?: boolean;
    onDelete: () => void;
    hour12?: boolean;
    whatsappEnabled?: boolean;
};

function formatResponseValue(
    guest: Guest,
    question: NonNullable<Guest["customQuestions"]>[number],
) {
    const value = guest.customQuestionResponses?.[question.id];
    if (!value) {
        return "No answer";
    }

    if (question.type === "multiselect") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                const selections = parsed.filter(
                    (item): item is string => typeof item === "string" && item.trim().length > 0,
                );
                return selections.length > 0 ? selections.join(", ") : "No answer";
            }
        } catch {
            return "Invalid response";
        }

        return "Invalid response";
    }

    return value;
}

export function GuestDetailForm({
    guest,
    onSave,
    allowEditingNotes = true,
    hour12 = true,
    whatsappEnabled,
    onSavingChange,
}: {
    guest: Guest;
    onSave: (updatedGuest: Partial<Guest>) => void;
    allowEditingNotes?: boolean;
    hour12?: boolean;
    whatsappEnabled?: boolean;
    onSavingChange?: (saving: boolean) => void;
}) {
    const {
        editStatus,
        setEditStatus,
        editNote,
        setEditNote,
        editInvitationSent,
        setEditInvitationSent,
        editInvitationOpened,
        setEditInvitationOpened,
        buildPayload,
    } = useGuestEditState(guest, { allowEditingNotes });
    const currency = guest.currency ?? "RWF";
    const summary = guest.rsvpSummary;
    const hasCustomQuestions = (guest.customQuestions?.length ?? 0) > 0;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        onSavingChange?.(true);
        Promise.resolve(
            onSave(buildPayload()),
        ).finally(() => {
            onSavingChange?.(false);
        });
    };

    return (
        <form id="guest-detail-form" className="space-y-6" onSubmit={handleSubmit}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-40">Field</TableHead>
                        <TableHead>Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">Name</TableCell>
                        <TableCell>{guest.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Email</TableCell>
                        <TableCell>{guest.email}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Phone</TableCell>
                        <TableCell>
                            {guest.phoneNumber ? (
                                <span className="text-sm">{guest.phoneNumber}</span>
                            ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                            )}
                            {whatsappEnabled && guest.whatsappInvitationSent && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-success-deep">
                                    <WhatsAppIcon className="h-3.5 w-3.5" />
                                    WhatsApp sent
                                </span>
                            )}
                        </TableCell>
                    </TableRow>
                    {guest.additionalGuests &&
                        guest.additionalGuests.length > 0 && (
                            <TableRow>
                                <TableCell className="font-medium">
                                    Additional guests
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        {guest.additionalGuests.map((ag) => (
                                            <div key={ag.id ?? ag.sortOrder}>
                                                {ag.name || "Guest"}
                                                {ag.categoryLabel
                                                    ? ` · ${ag.categoryLabel}`
                                                    : ""}
                                                {ag.email ? ` · ${ag.email}` : ""}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    <TableRow>
                        <TableCell className="font-medium">Status</TableCell>
                        <TableCell>
                            <Select
                                value={editStatus ?? "pending"}
                                onValueChange={(value) =>
                                    setEditStatus(value as Guest["rsvpStatus"] | "pending")
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value ?? "pending"}
                                            value={option.value ?? "pending"}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Responded at</TableCell>
                        <TableCell>
                            {guest.respondedAt
                                ? formatDateTime(guest.respondedAt, { hour12 })
                                : "—"}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Invitation Sent</TableCell>
                        <TableCell>
                            <Button
                                type="button"
                                variant={editInvitationSent ? "secondary" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setEditInvitationSent(!editInvitationSent)
                                }
                            >
                                {editInvitationSent ? "Sent" : "Not sent"}
                            </Button>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Invitation Opened</TableCell>
                        <TableCell>
                            <Button
                                type="button"
                                variant={editInvitationOpened ? "secondary" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setEditInvitationOpened(!editInvitationOpened)
                                }
                            >
                                {editInvitationOpened ? "Opened" : "Not opened"}
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {(summary || hasCustomQuestions) && (
                <div className="space-y-4">
                    {summary && (
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                    RSVP summary
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Structured attendee data for this RSVP.
                                </p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-md border border-border bg-background p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Total attendees
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">
                                        {summary.totalAttendees}
                                    </p>
                                </div>

                                <div className="rounded-md border border-border bg-background p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Contribution total
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {formatCurrency(summary.totalContribution, currency)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-md border border-border bg-background">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Count</TableHead>
                                            <TableHead>Rate</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.categoryBreakdown.map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell>{line.label}</TableCell>
                                                <TableCell>{line.count}</TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        line.contributionAmount,
                                                        currency,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(line.subtotalAmount, currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {hasCustomQuestions && (
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                    Additional questions
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Organizer-defined RSVP responses.
                                </p>
                            </div>
                            <div className="mt-4 space-y-3">
                                {guest.customQuestions?.map((question) => (
                                    <div
                                        key={question.id}
                                        className="rounded-md border border-border bg-background p-3"
                                    >
                                        <p className="text-sm font-medium text-foreground">
                                            {question.label}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                            {formatResponseValue(guest, question)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {allowEditingNotes && (
                <div className="grid gap-3">
                    <Label>Notes</Label>
                    <Textarea
                        value={editNote}
                        onChange={(event) => setEditNote(event.target.value)}
                        rows={4}
                        placeholder="Add dietary notes, plus-ones, or other context"
                    />
                </div>
            )}

        </form>
    );
}

export function GuestDetailSheet({
    guest,
    isLoading = false,
    isOpen,
    onOpenChange,
    onSave,
    onDelete,
    allowEditingNotes,
    hour12 = true,
    whatsappEnabled,
}: GuestDetailSheetProps) {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {guest ? guest.name : "Guest details"}
                    </DialogTitle>
                    <DialogDescription>
                        Review and edit RSVP information, notes, and invitation
                        status.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                {isLoading && (
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        Loading the latest RSVP details...
                    </div>
                )}
                {guest && (
                    <GuestDetailForm
                        key={guest.id}
                        guest={guest}
                        onSave={onSave}
                        allowEditingNotes={allowEditingNotes}
                        hour12={hour12}
                        whatsappEnabled={whatsappEnabled}
                        onSavingChange={setIsSaving}
                    />
                )}
                </DialogBody>
                {guest && (
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={onDelete}
                            disabled={isSaving}
                        >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button
                            type="submit"
                            form="guest-detail-form"
                            className="gap-2"
                            disabled={isSaving}
                        >
                            <CheckIcon className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
