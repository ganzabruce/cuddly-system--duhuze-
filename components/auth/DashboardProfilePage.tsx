"use client";

import { use } from "react";
import type { getDashboardProfileData } from "@/actions/auth/actions";
import { OrganizerProfileForm } from "./profile-form";

export function DashboardProfilePage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardProfileData>;
}) {
    const profile = use(dataPromise);

    return <OrganizerProfileForm initialProfile={profile} />;
}
