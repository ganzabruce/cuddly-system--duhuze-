"use client";

export default function AdminAuditLogError({ error }: { error: Error & { digest?: string } }) {
    return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            <h2 className="text-lg font-semibold">Unable to load audit log</h2>
            <p className="mt-2 text-sm opacity-80">
                {error.message || "Something went wrong while fetching audit entries."}
            </p>
        </div>
    );
}
