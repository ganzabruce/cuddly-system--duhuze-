import { Suspense } from "react";
import { getUserListAction } from "@/actions/admin/users";
import { UsersSection } from "@/components/admin/users/UsersSection";
import { UsersListSkeleton } from "@/components/skeletons/UsersListSkeleton";

type SearchParams = {
    page?: string;
    search?: string;
    status?: "ok" | "suspended";
};

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const search = params.search?.trim() ?? "";
    const statusParam = params.status;
    const status = statusParam === "ok" || statusParam === "suspended" ? statusParam : undefined;

    const resultPromise = getUserListAction({
        page,
        limit: 20,
        search: search || undefined,
        status,
    });

    return (
        <div className="w-full min-w-0">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">User Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage all registered users on the platform.
                </p>
            </div>

            {/* Users table card */}
            <div className="rounded-md border border-border bg-card">
                <div className="p-4 md:p-5">
                    <Suspense fallback={<UsersListSkeleton />}>
                        <UsersSection
                            resultPromise={resultPromise}
                            search={search}
                            statusParam={status}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
