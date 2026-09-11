"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import type { getUserDetailPageDataAction } from "@/actions/admin/users";
import { UserActionsServer } from "@/components/admin/users/UserActionsServer";

export function UserActionsSection({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getUserDetailPageDataAction>;
}) {
    const data = use(dataPromise);

    if (!data) {
        notFound();
    }

    return <UserActionsServer user={data.user} />;
}
