"use client";

import { use } from "react";
import type { getUserListAction } from "@/actions/admin/users";
import { UsersClient } from "./UsersClient";

type UsersSectionProps = {
    resultPromise: ReturnType<typeof getUserListAction>;
    search: string;
    statusParam: "ok" | "suspended" | undefined;
};

export function UsersSection({ resultPromise, search, statusParam }: UsersSectionProps) {
    const result = use(resultPromise);

    return (
        <UsersClient
            initialUsers={result.users}
            initialTotal={result.total}
            initialPage={result.page}
            initialSearch={search}
            initialStatus={statusParam ?? "all"}
        />
    );
}
