"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PendingPlanActions() {
    const router = useRouter();

    return (
        <div className="flex flex-wrap gap-3">
            <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/app/billing/checkout")}
            >
                Go back
            </Button>
            <Link href="/app/new">
                <Button type="button">Create event</Button>
            </Link>
        </div>
    );
}
