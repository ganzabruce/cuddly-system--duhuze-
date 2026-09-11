"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import type { Guest } from "@/types/guests";
import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";
import { GuestRowActions } from "./GuestRowActions";

type GuestTableProps = {
    guests: Guest[];
    rowReminderId: number | null;
    whatsappEnabled?: boolean;
    selectedGuestIds?: Set<number>;
    onSelectionChange?: (ids: Set<number>) => void;
    onOpenDetail: (guest: Guest) => void;
    onCopyEmail: (email: string) => void;
    onCopyRsvpLink: (guest: Guest) => void;
    onRowReminder: (guestId: number) => void;
    onToggleInvitationSent: (guest: Guest) => void;
    onDeleteGuest: (guest: Guest) => void;
    totalCount: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
};

export function GuestTable({
    guests,
    rowReminderId,
    whatsappEnabled,
    selectedGuestIds,
    onSelectionChange,
    onOpenDetail,
    onCopyEmail,
    onCopyRsvpLink,
    onRowReminder,
    onToggleInvitationSent,
    onDeleteGuest,
    totalCount,
    page,
    pageSize,
    onPageChange,
}: GuestTableProps) {
    const hasSelection =
        selectedGuestIds !== undefined && onSelectionChange !== undefined;
    const selectedSet = selectedGuestIds ?? new Set<number>();
    const allIds = guests.map((g) => g.id);
    const allSelected =
        guests.length > 0 && allIds.every((id) => selectedSet.has(id));
    const someSelected = selectedSet.size > 0;

    const colSpan = (hasSelection ? 7 : 6) - (whatsappEnabled ? 0 : 1);

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        const next = new Set(selectedSet);
        if (checked) allIds.forEach((id) => next.add(id));
        else allIds.forEach((id) => next.delete(id));
        onSelectionChange(next);
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (!onSelectionChange) return;
        const next = new Set(selectedSet);
        if (checked) next.add(id);
        else next.delete(id);
        onSelectionChange(next);
    };

    return (
        <div className="overflow-x-auto">
        <Table className="sm:min-w-[720px]">
            <TableHeader>
                <TableRow>
                    {hasSelection && (
                        <TableHead className="hidden w-10 pr-0 sm:table-cell">
                            <Checkbox
                                checked={allSelected}
                                data-state={
                                    someSelected && !allSelected
                                        ? "indeterminate"
                                        : allSelected
                                          ? "checked"
                                          : "unchecked"
                                }
                                onCheckedChange={(value) =>
                                    handleSelectAll(value === true)}
                                aria-label="Select all guests"
                            />
                        </TableHead>
                    )}
                    <TableHead>Guest</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    {whatsappEnabled && <TableHead className="hidden min-w-[120px] sm:table-cell">Phone</TableHead>}
                    <TableHead className="hidden w-[80px] sm:table-cell">Plus-ones</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {guests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={colSpan} className="h-24 text-center">
                            <p className="text-sm text-muted-foreground">No guests match this view.</p>
                            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                        </TableCell>
                    </TableRow>
                ) : (
                    guests.map((guest) => {
                        const isSelected = selectedSet.has(guest.id);
                        return (
                            <TableRow
                                key={guest.id}
                                data-state={isSelected ? "selected" : undefined}
                                className="cursor-pointer sm:cursor-default"
                                onClick={() => onOpenDetail(guest)}
                            >
                                {hasSelection && (
                                    <TableCell className="hidden pr-0 sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(value) =>
                                                handleSelectOne(guest.id, value === true)}
                                            aria-label={`Select ${guest.name}`}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>
                                    <p className="truncate font-medium text-foreground">{guest.name}</p>
                                    {whatsappEnabled && guest.phoneNumber && (
                                        <p className="truncate text-xs text-muted-foreground sm:hidden">{guest.phoneNumber}</p>
                                    )}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <p className="truncate text-xs text-muted-foreground">{guest.email || guest.phoneNumber || "—"}</p>
                                </TableCell>
                                <TableCell>
                                    <GuestStatusBadge status={guest.rsvpStatus} />
                                </TableCell>
                                {whatsappEnabled && (
                                    <TableCell className="hidden sm:table-cell">
                                        <p className="truncate text-xs text-muted-foreground">
                                            {guest.phoneNumber || "—"}
                                        </p>
                                    </TableCell>
                                )}
                                <TableCell className="hidden text-muted-foreground sm:table-cell">
                                    {(guest.additionalGuestCount ?? 0) > 0 ? `+${guest.additionalGuestCount}` : "—"}
                                </TableCell>
                                <TableCell className="hidden text-right sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                    <GuestRowActions
                                        guest={guest}
                                        isReminding={rowReminderId === guest.id}
                                        onOpenDetail={() => onOpenDetail(guest)}
                                        onCopyEmail={() => onCopyEmail(guest.email ?? "")}
                                        onCopyRsvpLink={() => onCopyRsvpLink(guest)}
                                        onRowReminder={() => onRowReminder(guest.id)}
                                        onToggleInvitationSent={() => onToggleInvitationSent(guest)}
                                        onDeleteGuest={() => onDeleteGuest(guest)}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
        <TablePagination
            totalCount={totalCount}
            pageSize={pageSize}
            page={page}
            onPageChange={onPageChange}
            itemLabel="guests"
        />
        </div>
    );
}
