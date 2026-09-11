"use client";

import {
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicProfilePath } from "@/lib/constants/events/profile-paths";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { UserWithStats } from "@/types/admin";

type UserTableProps = {
    users: UserWithStats[];
    onUserClick?: (userId: number) => void;
};

export function UserTable({ users, onUserClick }: UserTableProps) {
    const formatDate = (date: Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={6}
                            className="py-8 text-center text-muted-foreground"
                        >
                            No users found
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((user) => (
                        <TableRow
                            key={user.id}
                            className="cursor-pointer"
                            onClick={() => onUserClick?.(user.id)}
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className={`font-medium text-foreground ${user.name ? "" : "text-muted-foreground italic"}`}>
                                        {user.name ? user.name : "No name provided"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                {user.username ? (
                                    <Link
                                        href={getPublicProfilePath(user.username)}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button variant="link">
                                            {user.username}
                                        </Button>
                                    </Link>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {(() => {
                                    const isSuspended =
                                        user.status != null &&
                                        String(user.status).toLowerCase() === "suspended";
                                    return (
                                        <Badge variant={isSuspended ? "destructive" : "success"}>
                                            {isSuspended ? (
                                                <XCircleIcon className="h-3 w-3" />
                                            ) : (
                                                <CheckCircleIcon className="h-3 w-3" />
                                            )}
                                            {isSuspended ? "Suspended" : "Active"}
                                        </Badge>
                                    );
                                })()}
                            </TableCell>
                            <TableCell className="text-foreground">
                                {user.eventsCount}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                                {formatDate(user.createdAt)}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
        </div>
    );
}
