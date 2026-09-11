"use client";

export default function AdminSettingsError({ error }: { error: Error & { digest?: string } }) {
    return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            <h2 className="text-lg font-semibold">Unable to load settings</h2>
            <p className="mt-2 text-sm opacity-80">
                {error.message || "Something went wrong while loading your admin settings."}
            </p>
        </div>
    );
}
