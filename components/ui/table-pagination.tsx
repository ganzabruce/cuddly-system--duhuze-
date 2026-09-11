"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export const DEFAULT_PAGE_SIZE = 10;

export type TablePaginationProps = {
    totalCount: number;
    pageSize?: number;
    page: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
    className?: string;
};

export function TablePagination({
    totalCount,
    pageSize = DEFAULT_PAGE_SIZE,
    page,
    onPageChange,
    itemLabel = "items",
    className,
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

    return (
        <div
            className={cn(
                "flex items-center justify-between border-t border-border px-4 py-1.5",
                className,
            )}
        >
            <p className="text-xs text-muted-foreground">
                {totalCount === 0 ? (
                    `No ${itemLabel}`
                ) : (
                    <>
                        <span className="font-medium text-foreground">{rangeStart}–{rangeEnd}</span>
                        {" of "}
                        <span className="font-medium text-foreground">{totalCount}</span>
                        {" "}{itemLabel}
                    </>
                )}
            </p>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[5rem] text-center text-xs text-muted-foreground">
                    {page} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

export type UseTablePaginationOptions = {
    totalCount: number;
    pageSize?: number;
};

export type UseTablePaginationReturn<T> = {
    page: number;
    setPage: (page: number | ((prev: number) => number)) => void;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
    offset: number;
    paginate: (items: T[]) => T[];
};

export function useTablePagination<T>(
    options: UseTablePaginationOptions,
): UseTablePaginationReturn<T> {
    const { totalCount, pageSize = DEFAULT_PAGE_SIZE } = options;
    const [requestedPage, setRequestedPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const rangeStart = totalCount === 0 ? 0 : offset + 1;
    const rangeEnd = Math.min(offset + pageSize, totalCount);

    const setPage: UseTablePaginationReturn<T>["setPage"] = (next) => {
        if (typeof next === "function") {
            setRequestedPage((prev) => {
                const resolved = next(Math.min(prev, totalPages));
                return Math.max(1, resolved);
            });
            return;
        }
        setRequestedPage(Math.max(1, next));
    };

    const paginate = useMemo(
        () => (items: T[]) => items.slice(offset, offset + pageSize),
        [offset, pageSize],
    );

    return { page, setPage, totalPages, rangeStart, rangeEnd, offset, paginate };
}
