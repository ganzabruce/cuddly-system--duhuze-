"use client";

import { use } from "react";
import type { getAdminsPageDataAction } from "@/actions/admin/admins";
import { AdminsClient } from "@/components/admin/admins/AdminsClient";

export function AdminsDescription({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getAdminsPageDataAction>;
}) {
    const { currentAdmin } = use(dataPromise);

    return (
        <p className="mt-1 text-sm text-muted-foreground">
            Manage admin accounts and roles.
            {currentAdmin.role !== "owner" && " Only owners can add or modify admins."}
        </p>
    );
}

export function AdminsSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getAdminsPageDataAction>;
}) {
    const { currentAdmin, admins } = use(dataPromise);

    return <AdminsClient admins={admins} currentAdmin={currentAdmin} />;
}
