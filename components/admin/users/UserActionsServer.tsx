"use client";

import { UserActions } from "./UserActions";
import {
    suspendUserAction,
    unsuspendUserAction,
} from "@/actions/admin/users";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserWithStats } from "@/types/admin";


type UserActionsServerProps = {
    user: UserWithStats;
};

export function UserActionsServer({
    user,
}: UserActionsServerProps) {
    const router = useRouter();
    const [isSuspending, setIsSuspending] = useState(false);
    const [isUnsuspending, setIsUnsuspending] = useState(false);
    async function handleSuspend(reason: string) {
        setIsSuspending(true);
        try {
            const result = await suspendUserAction(user.id, reason);
            if (result.success) {
                router.refresh();
            } else {
                throw new Error(result.error);
            }
        } finally {
            setIsSuspending(false);
        }
    }

    async function handleUnsuspend() {
        setIsUnsuspending(true);
        try {
            await unsuspendUserAction(user.id);
            router.refresh();
        } finally {
            setIsUnsuspending(false);
        }
    }

    return (
        <UserActions
            user={user}
            onSuspend={handleSuspend}
            onUnsuspend={handleUnsuspend}
            isSuspending={isSuspending}
            isUnsuspending={isUnsuspending}
        />
    );
}
