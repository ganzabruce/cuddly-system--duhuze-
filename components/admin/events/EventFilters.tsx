"use client";

import {
    ChevronDownIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type EventFiltersProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    visibilityFilter: "public" | "private" | "all";
    onVisibilityFilterChange: (value: "public" | "private" | "all") => void;
    dateFilter: "upcoming" | "past" | "all";
    onDateFilterChange: (value: "upcoming" | "past" | "all") => void;
};

const VISIBILITY_OPTIONS = [
    { value: "all", label: "All Visibility" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
] as const;

const DATE_OPTIONS = [
    { value: "all", label: "All Dates" },
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
] as const;

export function EventFilters({
    searchTerm,
    onSearchChange,
    visibilityFilter,
    onVisibilityFilterChange,
    dateFilter,
    onDateFilterChange,
}: EventFiltersProps) {
    const selectedVisibilityLabel =
        VISIBILITY_OPTIONS.find((o) => o.value === visibilityFilter)?.label ?? "All Visibility";
    const selectedDateLabel =
        DATE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "All Dates";

    return (
        <div className="flex flex-col gap-4 md:flex-row w-full text-foreground">
            <div className="relative flex-1 min-w-0">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                <Input
                    placeholder="Search by title or organizer"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="pl-10 w-full"
                    aria-label="Search events"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 shrink-0"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                {selectedVisibilityLabel}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                        {VISIBILITY_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() =>
                                    onVisibilityFilterChange(
                                        option.value as "public" | "private" | "all"
                                    )
                                }
                                className={
                                    visibilityFilter === option.value ? "bg-accent" : ""
                                }
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 shrink-0"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                {selectedDateLabel}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                        {DATE_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() =>
                                    onDateFilterChange(
                                        option.value as "upcoming" | "past" | "all"
                                    )
                                }
                                className={dateFilter === option.value ? "bg-accent" : ""}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
