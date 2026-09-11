import type { AnalyticsDateRange } from "@/types/analytics";

export function parseDateParam(value: string | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function endOfDay(date: Date | null): Date | null {
    if (!date) return null;
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
}

export function getDateRange(
    range: string | undefined,
    startParam: string | undefined,
    endParam: string | undefined,
): AnalyticsDateRange {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);

    const preset =
        range === "all_time" ||
        range === "last_7_days" ||
        range === "last_30_days" ||
        range === "last_90_days" ||
        range === "custom"
            ? range
            : "all_time";

    if (preset === "all_time") return { preset, startDate: null, endDate: null };
    if (preset === "last_7_days") {
        start.setDate(today.getDate() - 6);
        return { preset, startDate: start, endDate: today };
    }
    if (preset === "last_90_days") {
        start.setDate(today.getDate() - 89);
        return { preset, startDate: start, endDate: today };
    }
    if (preset === "custom") {
        const startDate = parseDateParam(startParam);
        const endDate = parseDateParam(endParam);
        if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
            return { preset, startDate: endDate, endDate: startDate };
        }
        return { preset, startDate, endDate };
    }
    start.setDate(today.getDate() - 29);
    return { preset: "last_30_days", startDate: start, endDate: today };
}
