import { Suspense } from "react";
import { getErrorsPageDataAction } from "@/actions/admin/errors";
import { DeleteOldErrorsButton } from "@/components/admin/errors/DeleteOldErrorsButton";
import { ErrorsSection } from "@/components/admin/errors/ErrorsSection";
import { ErrorsSkeleton } from "@/components/skeletons/ErrorsSkeleton";

const PAGE_SIZE = 50;

type SearchParams = { page?: string; level?: string; resolved?: string; source?: string };

export default async function AdminErrorsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const level = (params.level === "warn" || params.level === "error"
        ? params.level
        : "all") as "all" | "warn" | "error";
    const resolvedParam = params.resolved;
    const resolved =
        resolvedParam === "resolved"
            ? true
            : resolvedParam === "unresolved"
              ? false
              : undefined;
    const source = params.source?.trim() || undefined;

    const dataPromise = getErrorsPageDataAction({
        page,
        limit: PAGE_SIZE,
        level: level === "all" ? undefined : level,
        resolved,
        source: source || undefined,
    });

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                        Error Log
                    </h1>
                    <div className="flex items-center gap-2">
                        <DeleteOldErrorsButton />
                    </div>
                </div>
            </div>
            <Suspense fallback={<ErrorsSkeleton />}>
                <ErrorsSection
                    dataPromise={dataPromise}
                    level={level}
                    resolved={resolved}
                    source={source ?? ""}
                />
            </Suspense>
        </div>
    );
}
