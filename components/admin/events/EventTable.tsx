"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants/events/constants";
import {
    EyeIcon,
    EyeSlashIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import type { EventWithStats } from "@/types/admin";

type EventTableProps = {
    events: EventWithStats[];
    onEventClick?: (event: EventWithStats) => void;
};

export function EventTable({ events, onEventClick }: EventTableProps) {
    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString();
    };
    const handleMobileCardKeyDown = (
        event: KeyboardEvent<HTMLElement>,
        item: EventWithStats,
    ) => {
        if (!onEventClick) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEventClick(item);
        }
    };

    return (
        <>
            <div className="space-y-3 md:hidden">
                {events.length === 0 ? (
                    <div className="rounded-md border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                        No events found
                    </div>
                ) : (
                    events.map((event) => (
                        <article
                            key={event.id}
                            className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                            onClick={() => onEventClick?.(event)}
                            onKeyDown={(e) => handleMobileCardKeyDown(e, event)}
                            role={onEventClick ? "button" : undefined}
                            tabIndex={onEventClick ? 0 : undefined}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-foreground">
                                        {event.title}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {event.organizerName}
                                    </p>
                                    {event.organizerUsername ? (
                                        <p className="text-xs text-muted-foreground">
                                            @{event.organizerUsername}
                                        </p>
                                    ) : null}
                                </div>
                                <Badge
                                    variant={event.visibility === "public" ? "primary" : "secondary"}
                                >
                                    {event.visibility === "public" ? (
                                        <EyeIcon className="h-3 w-3" />
                                    ) : (
                                        <EyeSlashIcon className="h-3 w-3" />
                                    )}
                                    {event.visibility === "public" ? "Public" : "Private"}
                                </Badge>
                            </div>

                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Category
                                    </dt>
                                    <dd className="mt-1 text-foreground">
                                        {event.category
                                            ? EVENT_CATEGORY_LABELS[event.category] ?? event.category
                                            : "Uncategorized"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Guests
                                    </dt>
                                    <dd className="mt-1 text-foreground">{event.guestCount}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Date
                                    </dt>
                                    <dd className="mt-1 text-foreground">{formatDateTime(event.date)}</dd>
                                </div>
                            </dl>

                            <div className="mt-4 flex justify-end">
                                <Link
                                    href={`/admin/events/${event.username}/${event.slug}`}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View details
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Organizer</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Guests</TableHead>
                            <TableHead className="text-right">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center">
                                    No events found
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow
                                    key={event.id}
                                    className="cursor-pointer"
                                    onClick={() => onEventClick?.(event)}
                                >
                                    <TableCell>
                                        <div className="font-medium">{event.title}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{event.organizerName}</div>
                                        {event.organizerUsername && (
                                            <div className="text-xs text-muted-foreground">
                                                @{event.organizerUsername}
                                            </div>
                                        )}
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {event.category
                                                ? EVENT_CATEGORY_LABELS[event.category] ?? event.category
                                                : "Uncategorized"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={event.visibility === "public" ? "primary" : "secondary"}
                                        >
                                            {event.visibility === "public" ? (
                                                <EyeIcon className="h-3 w-3" />
                                            ) : (
                                                <EyeSlashIcon className="h-3 w-3" />
                                            )}
                                            {event.visibility === "public" ? "Public" : "Private"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDateTime(event.date)}</TableCell>
                                    <TableCell>{event.guestCount}</TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/admin/events/${event.username}/${event.slug}`}
                                            className="inline-flex items-center text-primary hover:text-primary/80"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="sr-only">View details</span>
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
