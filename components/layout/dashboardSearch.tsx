"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    TicketIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
    dashboardSearch as runDashboardSearch,
    type DashboardSearchResult,
} from "@/actions/events/search-service";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;

function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function ResultIcon({ type }: { type: DashboardSearchResult["type"] }) {
    switch (type) {
        case "event":
            return (
                <CalendarDaysIcon className="h-4 w-4 shrink-0 text-foreground" />
            );
        case "guest":
            return (
                <TicketIcon className="h-4 w-4 shrink-0 text-foreground" />
            );
    }
}

export function DashboardSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<DashboardSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
            return;
        }
        let cancelled = false;
        Promise.resolve().then(() => {
            if (!cancelled) setLoading(true);
        });
        runDashboardSearch(debouncedQuery)
            .then((list) => {
                if (!cancelled) {
                    setResults(list);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const handleSelect = (href: string) => {
        setQuery("");
        setOpen(false);
        setResults([]);
        router.push(href);
    };

    const showPanel = open && query.length >= MIN_QUERY_LENGTH;

    useEffect(() => {
        if (!showPanel) return;
        function handleClickOutside(e: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showPanel]);

    return (
        <div className="relative w-full min-w-[20vw] max-w-2xl" ref={wrapperRef}>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input
                type="search"
                placeholder="Search events, guests…"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.length >= MIN_QUERY_LENGTH) {
                        setOpen(true);
                    } else {
                        setResults([]);
                        setOpen(false);
                    }
                }}
                onFocus={() =>
                    query.length >= MIN_QUERY_LENGTH && setOpen(true)
                }
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
                className="h-9 w-full rounded-md border-border-subtle bg-card/80 pl-9 pr-3 shadow-sm"
                autoComplete="off"
            />
            {showPanel && (
                <div
                    className="absolute left-0 top-full z-50 mt-1 w-full sm:min-w-[20rem] max-w-[24rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
                    role="listbox"
                >
                    <div className="max-h-[min(20rem,50vh)] overflow-y-auto py-1">
                        {loading ? (
                            <div className="py-6 text-center text-sm text-foreground">
                                Searching…
                            </div>
                        ) : results.length === 0 ? (
                            <div className="py-6 text-center text-sm text-foreground">
                                No results
                            </div>
                        ) : (
                            <ul>
                                {results.map((r) => (
                                    <li key={`${r.type}-${r.id}`}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSelect(r.href)
                                            }
                                            className={cn(
                                                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground",
                                                "hover:bg-surface-raised hover:text-foreground focus:bg-surface-raised focus:text-foreground outline-none"
                                            )}
                                        >
                                            <ResultIcon type={r.type} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium">
                                                    {r.label}
                                                </span>
                                                {r.subtitle && (
                                                    <span className="block truncate text-xs">
                                                        {r.subtitle}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
