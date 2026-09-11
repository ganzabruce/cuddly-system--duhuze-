import { getCurrentUser } from "@/lib/services/auth/auth";
import { redirect } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SuspendedPage() {
    const user = await getCurrentUser();
    
    if (!user) {
        redirect("/login");
    }

    if (user.status !== "suspended") {
        redirect("/app");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-destructive-surface flex items-center justify-center">
                        <XCircleIcon className="h-8 w-8 text-destructive" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Account Suspended
                    </h1>
                    <p className="text-muted-foreground">
                        Your account has been suspended and you cannot access the platform.
                    </p>
                    {user.suspendedReason && (
                        <div className="mt-4 p-4 rounded-md bg-muted border border-border">
                            <p className="text-sm font-medium text-foreground mb-1">
                                Reason:
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {user.suspendedReason}
                            </p>
                        </div>
                    )}
                    {user.suspendedAt && (
                        <p className="text-xs text-muted-foreground">
                            Suspended on {new Date(user.suspendedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        If you believe this is an error, please contact support.
                    </p>
                    <Link href="/">
                        <Button variant="outline">
                            Return to Homepage
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
