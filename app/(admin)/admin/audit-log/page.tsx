import { Suspense } from "react";
import { getAuditLogAction } from "@/actions/admin/audit-log";
import { AuditLogSection } from "@/components/admin/audit/AuditLogSection";
import { AuditLogSkeleton } from "@/components/skeletons/AuditLogSkeleton";

type SearchParams = {
    page?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
};

const PAGE_SIZE = 30;

export default async function AdminAuditLogPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;

    const resultPromise = getAuditLogAction({
        page,
        limit: PAGE_SIZE,
        action: params.action?.trim() || undefined,
        targetType: params.targetType?.trim() || undefined,
        startDate,
        endDate,
    });

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                        <h1 className="m-0 p-0 text-xl font-semibold text-foreground">
                            Audit Log
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track every admin action for compliance and visibility.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-border bg-card">
                <div className="p-4 md:p-6">
                    <Suspense fallback={<AuditLogSkeleton />}>
                        <AuditLogSection
                            resultPromise={resultPromise}
                            pageSize={PAGE_SIZE}
                            initialAction={params.action ?? ""}
                            initialTargetType={params.targetType ?? ""}
                            initialStartDate={params.startDate ?? ""}
                            initialEndDate={params.endDate ?? ""}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
