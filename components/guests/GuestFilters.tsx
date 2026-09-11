"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

export type GuestFiltersProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
};

export function GuestFilters({
    searchTerm,
    onSearchChange,
    searchPlaceholder = "Search by name, email, or note",
}: GuestFiltersProps) {
    return (
        <div className="flex flex-1 items-center text-foreground">
            <div className="relative w-full md:w-96">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full pl-10"
                    aria-label="Search guests"
                />
            </div>
        </div>
    );
}
