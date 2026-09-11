"use client";

import { use } from "react";
import type { getDashboardSettingsData } from "@/actions/auth/actions";
import { SettingsClient } from "./SettingsClient";

export function DashboardSettingsPage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardSettingsData>;
}) {
    const { settings, username, userEmail } = use(dataPromise);

    return (
        <SettingsClient
            initialSettings={settings}
            username={username}
            userEmail={userEmail}
        />
    );
}
