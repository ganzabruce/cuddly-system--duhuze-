import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDetailSection } from "@/components/admin/users/UserDetailSection";
import { UserActionsSection } from "@/components/admin/users/UserActionsSection";
import { UserDetailSkeleton } from "@/components/skeletons/UserDetailSkeleton";
import { getUserDetailPageDataAction } from "@/actions/admin/users";

export default async function AdminUserDetailRoute({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const dataPromise = getUserDetailPageDataAction(username);

    return (
        <div className="w-full min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link href="/admin/users">
                    <Button variant="ghost" size="sm" className="gap-1.5 pl-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Users
                    </Button>
                </Link>
                <Suspense fallback={<Skeleton className="h-9 w-24" />}>
                    <UserActionsSection dataPromise={dataPromise} />
                </Suspense>
            </div>

            <Suspense fallback={<UserDetailSkeleton />}>
                <UserDetailSection dataPromise={dataPromise} />
            </Suspense>
        </div>
    );
}
