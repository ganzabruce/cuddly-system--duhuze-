"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserDetailCard } from "./UserDetailCard";
import { TablePagination } from "@/components/ui/table-pagination";
import {
    getAdminUserDetailAction,
} from "@/actions/admin/users";
import type { UserWithStats, AdminUserDetail } from "@/types/admin";

type UsersClientProps = {
    initialUsers: UserWithStats[];
    initialTotal: number;
    initialPage: number;
    initialSearch: string;
    initialStatus: "ok" | "suspended" | "all";
};

export function UsersClient({
    initialUsers,
    initialTotal,
    initialPage,
    initialSearch,
    initialStatus,
}: UsersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();
    const [detailUserId, setDetailUserId] = useState<number | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<"ok" | "suspended" | "all">(initialStatus);

    const updateURL = (updates: {
        search?: string;
        status?: "ok" | "suspended" | "all";
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
        
        if (updates.status !== undefined && updates.status !== "all") {
            params.set("status", updates.status);
        } else {
            params.delete("status");
        }
        
        if (updates.page !== undefined && updates.page > 1) {
            params.set("page", updates.page.toString());
        } else {
            params.delete("page");
        }

        startTransition(() => {
            router.push(`/admin/users?${params.toString()}`);
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        updateURL({ search: value, page: 1 });
    };

    const handleStatusChange = (value: "ok" | "suspended" | "all") => {
        setStatusFilter(value);
        updateURL({ status: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        updateURL({ page });
    };

    const handleUserClick = (userId: number) => {
        setDetailUserId(userId);
        setDetailDialogOpen(true);
    };

    useEffect(() => {
        if (!detailDialogOpen || detailUserId == null) {
            return;
        }
        Promise.resolve().then(() => {
            setLoading(true);
            setError(null);
        });
        getAdminUserDetailAction(detailUserId)
            .then((data) => {
                setUser(data ?? null);
                if (data == null) setError("User not found");
            })
            .catch(() => setError("Failed to load user"))
            .finally(() => setLoading(false));
    }, [detailDialogOpen, detailUserId]);

    const closeDialog = () => {
        setDetailDialogOpen(false);
        setDetailUserId(null);
        setUser(null);
        setError(null);
    };

    return (
        <div className="space-y-4">
            <UserFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusChange}
            />

            <div className="border-border">
                <UserTable users={initialUsers} onUserClick={handleUserClick} />
            </div>

            <Dialog
                open={detailDialogOpen}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
            >
                <DialogContent
                    className="max-w-3xl"
                    showCloseButton={true}
                >
                    <DialogHeader>
                        <DialogTitle>User details</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                    {loading && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Loading…
                        </div>
                    )}
                    {error && (
                        <div className="py-8 text-center text-sm text-destructive">{error}</div>
                    )}
                    {user && !loading && (
                        <UserDetailCard user={user} />
                    )}
                    </DialogBody>
                    {user && !loading && user.username && (
                        <DialogFooter>
                            <Link
                                href={`/admin/users/${user.username}`}
                                className="block w-full"
                            >
                                <Button variant="default" className="w-full">
                                    View full profile
                                </Button>
                            </Link>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <TablePagination
                totalCount={initialTotal}
                pageSize={20}
                page={initialPage}
                onPageChange={handlePageChange}
                itemLabel="users"
            />
        </div>
    );
}
