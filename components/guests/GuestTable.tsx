"use client";

import Link from "next/link";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ClipboardDocumentIcon,
    EllipsisVerticalIcon,
    EnvelopeIcon,
    EyeIcon,
    LinkIcon,
    TrashIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Guest } from "@/types/guests";
import { cn, formatEventDate } from "@/lib/utils";
import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";

export type GuestTableSortColumn =
    | "name"
    | "email"
    | "event"
    | "eventDate"
    | "status";

type GuestTableProps = {
    guests: Guest[];
    sortBy?: GuestTableSortColumn | null;
    sortDirection?: "asc" | "desc";
    onSortChange?: (column: GuestTableSortColumn) => void;
    onViewDetail: (guest: Guest) => void;
    onCopyEmail: (email: string) => void;
    onCopyEventLink: (guest: Guest) => void;
    onSendReminder: (guestId: number) => void;
    onDelete: (guest: Guest) => void;
    rowReminderId: number | null;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
};

function SortableHead({
    column,
    label,
    sortBy,
    sortDirection,
    onSortChange,
    className,
}: {
    column: GuestTableSortColumn;
    label: string;
    sortBy: GuestTableSortColumn | null | undefined;
    sortDirection: "asc" | "desc";
    onSortChange: (column: GuestTableSortColumn) => void;
    className?: string;
}) {
    const isActive = sortBy === column;
    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={() => onSortChange(column)}
                className={cn(
                    "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                    isActive && "text-foreground",
                )}
            >
                {label}
                {isActive ? (
                    sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-4 w-4 shrink-0" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4 shrink-0" />
                    )
                ) : (
                    <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-40" />
                )}
            </button>
        </TableHead>
    );
}

export function GuestTable({
    guests,
    sortBy = null,
    sortDirection = "asc",
    onSortChange = () => {},
    onViewDetail,
    onCopyEmail,
    onCopyEventLink,
    onSendReminder,
    onDelete,
    rowReminderId,
    selectedIds,
    onSelectionChange,
}: GuestTableProps) {
    const itemIconClassName = "size-4 shrink-0 text-muted-foreground";
    const allSelected =
        guests.length > 0 && selectedIds.length === guests.length;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(guests.map((g) => g.id));
        }
    };

    const handleSelectGuest = (guestId: number) => {
        if (selectedIds.includes(guestId)) {
            onSelectionChange(selectedIds.filter((id) => id !== guestId));
        } else {
            onSelectionChange([...selectedIds, guestId]);
        }
    };
    if (guests.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        No guests match this view
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Try adjusting your search or filters, or create a new event
                        to gather RSVPs.
                    </p>
                </div>
                <Link href="/new" className="mt-2">
                    <Button size="sm">Create your first event</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[48px]">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all guests"
                        />
                    </TableHead>
                    <SortableHead
                        column="name"
                        label="Guest Name"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                    />
                    <SortableHead
                        column="email"
                        label="Email"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                        className="hidden sm:table-cell"
                    />
                    <SortableHead
                        column="event"
                        label="Event"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                    />
                    <SortableHead
                        column="eventDate"
                        label="Event Date"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                        className="hidden sm:table-cell"
                    />
                    <TableHead className="hidden min-w-[120px] sm:table-cell">Phone</TableHead>
                    <SortableHead
                        column="status"
                        label="Response"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                    />
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {guests.map((guest) => (
                    <TableRow key={guest.id}>
                        <TableCell>
                            <Checkbox
                                checked={selectedIds.includes(guest.id)}
                                onCheckedChange={() => handleSelectGuest(guest.id)}
                                aria-label={`Select ${guest.name}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                            {guest.name}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {guest.email}
                        </TableCell>
                        <TableCell>
                            <Link
                                href={`/app/events/${guest.eventSlug}`}
                                className="text-primary hover:underline"
                            >
                                {guest.eventTitle}
                            </Link>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {guest.eventDate
                                ? formatEventDate(guest.eventDate)
                                : "—"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {guest.phoneNumber || "—"}
                        </TableCell>
                        <TableCell>
                            <GuestStatusBadge
                                status={guest.rsvpStatus}
                                invitationSent={guest.invitationSent}
                            />
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 hover:bg-muted h-8 w-8 text-muted-foreground hover:text-foreground"
                                    aria-label="Open guest actions"
                                >
                                    <EllipsisVerticalIcon className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        onClick={() => onViewDetail(guest)}
                                    >
                                        <EyeIcon className={itemIconClassName} />
                                        View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        onClick={() => onCopyEmail(guest.email ?? "")}
                                    >
                                        <ClipboardDocumentIcon className={itemIconClassName} />
                                        Copy email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        onClick={() => onCopyEventLink(guest)}
                                    >
                                        <LinkIcon className={itemIconClassName} />
                                        Copy event link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        disabled={rowReminderId === guest.id}
                                        onClick={() => onSendReminder(guest.id)}
                                    >
                                        <EnvelopeIcon className={itemIconClassName} />
                                        {rowReminderId === guest.id
                                            ? "Sending..."
                                            : "Send reminder"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="gap-2 p-2 text-destructive focus:text-destructive"
                                        onClick={() => onDelete(guest)}
                                    >
                                        <TrashIcon className="size-4 shrink-0 text-destructive" />
                                        Remove guest
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        </div>
    );
}
