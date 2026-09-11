"use client";

import { ChevronDownIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type ErrorLogFiltersProps = {
    levelFilter: "all" | "warn" | "error";
    onLevelFilterChange: (value: "all" | "warn" | "error") => void;
    resolvedFilter: "all" | "resolved" | "unresolved";
    onResolvedFilterChange: (value: "all" | "resolved" | "unresolved") => void;
    sourceSearch: string;
    onSourceSearchChange: (value: string) => void;
};

const LEVEL_OPTIONS = [
    { value: "all", label: "All levels" },
    { value: "warn", label: "Warning" },
    { value: "error", label: "Error" },
] as const;

const RESOLVED_OPTIONS = [
    { value: "all", label: "All" },
    { value: "unresolved", label: "Unresolved" },
    { value: "resolved", label: "Resolved" },
] as const;

export function ErrorLogFilters({
    levelFilter,
    onLevelFilterChange,
    resolvedFilter,
    onResolvedFilterChange,
    sourceSearch,
    onSourceSearchChange,
}: ErrorLogFiltersProps) {
    const levelLabel =
        LEVEL_OPTIONS.find((o) => o.value === levelFilter)?.label ?? "All levels";
    const resolvedLabel =
        RESOLVED_OPTIONS.find((o) => o.value === resolvedFilter)?.label ?? "All";

    return (
        <div className="flex w-full flex-col gap-4 text-foreground md:flex-row">
            <div className="min-w-0 flex-1">
                <Input
                    placeholder="Filter by source (e.g. api/events)"
                    value={sourceSearch}
                    onChange={(e) => onSourceSearchChange(e.target.value)}
                    className="w-full"
                    aria-label="Filter by source"
                />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" size="sm" className="gap-2 shrink-0">
                                <FunnelIcon className="h-4 w-4" />
                                {levelLabel}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-40">
                        {LEVEL_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onLevelFilterChange(option.value)}
                                className={levelFilter === option.value ? "bg-accent" : ""}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" size="sm" className="gap-2 shrink-0">
                                {resolvedLabel}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-40">
                        {RESOLVED_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onResolvedFilterChange(option.value)}
                                className={resolvedFilter === option.value ? "bg-accent" : ""}
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
