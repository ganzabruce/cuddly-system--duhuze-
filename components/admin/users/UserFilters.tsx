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

type UserFiltersProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: "ok" | "suspended" | "all";
    onStatusFilterChange: (value: "ok" | "suspended" | "all") => void;
};

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "ok", label: "Active" },
    { value: "suspended", label: "Suspended" },
] as const;

export function UserFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: UserFiltersProps) {
    const selectedStatusLabel =
        STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All Status";

    return (
        <div className="flex flex-col gap-4 md:flex-row w-full text-muted-foreground">
            <div className="relative flex-1 min-w-0">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                <Input
                    placeholder="Search by name, email, or username"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="pl-10 w-full"
                    aria-label="Search users"
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
                                {selectedStatusLabel}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                        {STATUS_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() =>
                                    onStatusFilterChange(
                                        option.value as "ok" | "suspended" | "all"
                                    )
                                }
                                className={
                                    statusFilter === option.value
                                        ? "bg-accent/50 text-accent-foreground"
                                        : ""
                                }
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
