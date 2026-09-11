"use client";

import { MagnifyingGlassIcon, FunnelIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

type AuditLogFiltersProps = {
    action: string;
    onActionChange: (value: string) => void;
    targetType: string;
    onTargetTypeChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
    isPending: boolean;
};

export function AuditLogFilters({
    action,
    onActionChange,
    targetType,
    onTargetTypeChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    isPending,
}: AuditLogFiltersProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Filter by action"
                    className="pl-10"
                    value={action}
                    onChange={(event) => onActionChange(event.target.value)}
                    disabled={isPending}
                />
            </div>
            <div className="relative">
                <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Filter by target type"
                    className="pl-10"
                    value={targetType}
                    onChange={(event) => onTargetTypeChange(event.target.value)}
                    disabled={isPending}
                />
            </div>
            <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="date"
                    className="pl-10"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                    disabled={isPending}
                />
            </div>
            <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="date"
                    className="pl-10"
                    value={endDate}
                    onChange={(event) => onEndDateChange(event.target.value)}
                    disabled={isPending}
                />
            </div>
        </div>
    );
}
