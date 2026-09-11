"use client";

import { use } from "react";
import type { getDashboardAllGuests } from "@/actions/guests/actions";
import { AllGuestsClient } from "./AllGuestsClient";

export function DashboardAllGuestsPage({
    dataPromise,
}: {
    dataPromise: ReturnType<typeof getDashboardAllGuests>;
}) {
    const data = use(dataPromise);

    return (
        <AllGuestsClient
            guests={data.guests}
            events={data.events}
            hour12={data.hour12}
        />
    );
}
