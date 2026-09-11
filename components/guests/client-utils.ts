import { toast } from "sonner";
import type { Guest } from "@/types/guests";
import { exportGuestsToCsv } from "@/lib/constants/guests/guest-csv";

export function exportGuestsToCSV(
    guests: Guest[],
    options: { hour12?: boolean } = {},
) {
    exportGuestsToCsv(guests, { includeEventColumns: true, hour12: options.hour12 });
}

export async function copyEmailToClipboard(email: string): Promise<void> {
    if (!navigator?.clipboard) {
        toast.error("Clipboard is not available in this environment.");
        return;
    }
    await navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard.");
}

export async function copyEventLinkToClipboard(
    eventSlug: string,
): Promise<void> {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/app/events/${eventSlug}`;

    if (!navigator?.clipboard) {
        toast.error("Clipboard is not available in this environment.");
        return;
    }

    await navigator.clipboard.writeText(link);
    toast.success("Event management link copied.");
}
