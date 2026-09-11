"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    UserIcon,
    CalendarDaysIcon,
    TicketIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { adminSearch, type AdminSearchResult } from "@/actions/admin/search-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

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

function ResultIcon({ type }: { type: AdminSearchResult["type"] }) {
    switch (type) {
        case "user":
            return <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
        case "event":
            return <CalendarDaysIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
        case "guest":
            return <TicketIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
}

export function AdminHeaderSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AdminSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
        adminSearch(debouncedQuery)
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
        setMobileSearchOpen(false);
        setResults([]);
        router.push(href);
    };

    const showPanel = open && query.length >= MIN_QUERY_LENGTH;

    useEffect(() => {
        if (!showPanel) return;
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPanel]);

    const resultList = (
        <div className="max-h-[min(24rem,65vh)] overflow-y-auto py-1">
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
                                onClick={() => handleSelect(r.href)}
                                className={cn(
                                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground",
                                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
                                )}
                            >
                                <ResultIcon type={r.type} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">
                                        {r.label}
                                    </span>
                                    {r.subtitle && (
                                        <span className="block truncate text-xs text-muted-foreground">
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
    );

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md md:hidden"
                aria-label="Search admin"
                onClick={() => setMobileSearchOpen(true)}
            >
                <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>

            <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                <SheetContent
                    side="top"
                    className="h-auto gap-0 border-b p-0 md:hidden"
                    showCloseButton={false}
                >
                    <SheetHeader className="border-b border-border pb-4 pr-16">
                        <SheetTitle>Search admin</SheetTitle>
                        <SheetDescription>
                            Search guests, events, and users without leaving the current page.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="p-4 pt-3">
                        <div className="relative">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                            <Input
                                type="search"
                                placeholder="Search guests, events, users…"
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
                                    if (e.key === "Escape") setMobileSearchOpen(false);
                                }}
                                className="h-10 w-full rounded-md border-border bg-muted/50 pl-9 pr-10"
                                autoComplete="off"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setResults([]);
                                        setOpen(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    aria-label="Clear search"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        {query.length >= MIN_QUERY_LENGTH ? (
                            <div
                                className="mt-3 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-sm"
                                role="listbox"
                            >
                                {resultList}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                Enter at least 2 characters to search.
                            </p>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <div
                className="relative hidden w-full min-w-0 max-w-2xl md:block md:min-w-[18rem]"
                ref={wrapperRef}
            >
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                <Input
                    type="search"
                    placeholder="Search guests, events, users…"
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
                    onFocus={() => query.length >= MIN_QUERY_LENGTH && setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setOpen(false);
                    }}
                    className="h-9 w-full rounded-md border-border bg-muted/50 pl-9 pr-3"
                    autoComplete="off"
                />
                {showPanel && (
                    <div
                        className="absolute left-0 top-full z-50 mt-1 w-full max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
                        role="listbox"
                    >
                        {resultList}
                    </div>
                )}
            </div>
        </>
    );
}
