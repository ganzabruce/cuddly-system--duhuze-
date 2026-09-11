import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { withRedirectUrl } from "@/lib/constants/auth/auth-redirect";
import { DbDependencyError } from "@/lib/db/errors";
import { MaintenanceScreen } from "@/components/ui/errors/MaintenanceScreen";
import { AppTopLoader } from "@/components/layout/AppTopLoader";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const requestHeaders = await headers();
    const returnPath = requestHeaders.get("x-duhuze-return-path");

    let user;
    try {
        user = await getCurrentUser();
    } catch (error) {
        if (error instanceof DbDependencyError) {
            return <MaintenanceScreen />;
        }
        throw error;
    }

    if (!user) {
        redirect(withRedirectUrl("/login", returnPath));
    }

    // Check user status first - suspended users must never access onboarding/app
    if (user.status === "suspended") {
        redirect("/suspended");
    }

    if (!user.username) {
        redirect(withRedirectUrl("/onboarding", returnPath));
    }

    const messages = await getMessages();

    return (
      <NextIntlClientProvider messages={messages}>
          <AppTopLoader />
          <div className="min-h-screen bg-background">
              {children}
          </div>
        </NextIntlClientProvider>
    );
}
