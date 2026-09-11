import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth/auth";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    if (!user.username) {
        redirect("/onboarding");
    }
    redirect("/app/overview");
}
