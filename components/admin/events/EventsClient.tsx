"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventFilters } from "./EventFilters";
import { EventTable } from "./EventTable";
import { TablePagination } from "@/components/ui/table-pagination";
import type { EventWithStats } from "@/types/admin";

type EventsClientProps = {
    initialEvents: EventWithStats[];
    initialTotal: number;
    initialPage: number;
    initialSearch: string;
    initialVisibility: "public" | "private" | "all";
    initialDateFilter: "upcoming" | "past" | "all";
};

export function EventsClient({
    initialEvents,
    initialTotal,
    initialPage,
    initialSearch,
    initialVisibility,
    initialDateFilter,
}: EventsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [visibilityFilter, setVisibilityFilter] = useState<"public" | "private" | "all">(initialVisibility);
    const [dateFilter, setDateFilter] = useState<"upcoming" | "past" | "all">(initialDateFilter);

    const updateURL = (updates: {
        search?: string;
        visibility?: "public" | "private" | "all";
        filter?: "upcoming" | "past" | "all";
        page?: number;
    }) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (updates.search !== undefined) {
            if (updates.search) {
                params.set("search", updates.search);
            } else {
                params.delete("search");
            }
        }
        
        if (updates.visibility !== undefined && updates.visibility !== "all") {
            params.set("visibility", updates.visibility);
        } else {
            params.delete("visibility");
        }
        
        if (updates.filter !== undefined && updates.filter !== "all") {
            params.set("filter", updates.filter);
        } else {
            params.delete("filter");
        }
        
        if (updates.page !== undefined && updates.page > 1) {
            params.set("page", updates.page.toString());
        } else {
            params.delete("page");
        }

        startTransition(() => {
            router.push(`/admin/events?${params.toString()}`);
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        updateURL({ search: value, page: 1 });
    };

    const handleVisibilityChange = (value: "public" | "private" | "all") => {
        setVisibilityFilter(value);
        updateURL({ visibility: value, page: 1 });
    };

    const handleDateFilterChange = (value: "upcoming" | "past" | "all") => {
        setDateFilter(value);
        updateURL({ filter: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        updateURL({ page });
    };

    const handleEventClick = (event: EventWithStats) => {
        router.push(`/admin/events/${event.username}/${event.slug}`);
    };

    return (
        <div className="space-y-4">
            <EventFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                visibilityFilter={visibilityFilter}
                onVisibilityFilterChange={handleVisibilityChange}
                dateFilter={dateFilter}
                onDateFilterChange={handleDateFilterChange}
            />

            <div className="border-t border-border">
                <EventTable events={initialEvents} onEventClick={handleEventClick} />
            </div>

            <TablePagination
                totalCount={initialTotal}
                pageSize={20}
                page={initialPage}
                onPageChange={handlePageChange}
                itemLabel="events"
            />
        </div>
    );
}
