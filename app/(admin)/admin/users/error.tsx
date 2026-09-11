"use client";

export default function AdminUsersError({ error }: { error: Error & { digest?: string } }) {
    return (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-6 text-destructive">
            <h2 className="text-lg font-semibold">Unable to load users</h2>
            <p className="mt-2 text-sm opacity-80">
                {error.message || "Something went wrong while fetching the user list."}
            </p>
        </div>
    );
}
