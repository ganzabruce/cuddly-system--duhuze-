"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, syncProfileToAuthProvider } from "@/lib/services/auth/auth";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";
import logger from "@/lib/utils/logger";
import {
    updateUserProfile,
    normalizeUsername,
    fetchUserByUsername,
} from "@/lib/services/auth/user-service";
import { getPublicProfilePath } from "@/lib/constants/events/profile-paths";

interface ActionState {
    error: string | null;
}

function mapOnboardingErrorMessage(error: unknown): string {
    const authError = error as { errors?: Array<{ message?: string }> };
    const rawMessage = authError?.errors?.[0]?.message?.toLowerCase() ?? "";

    if (
        rawMessage.includes("username") &&
        (rawMessage.includes("taken") || rawMessage.includes("exists") || rawMessage.includes("unavailable"))
    ) {
        return "That username is already taken. Please choose another one.";
    }

    if (rawMessage.includes("rate") || rawMessage.includes("too many")) {
        return "Too many attempts. Please wait a moment and try again.";
    }

    if (rawMessage.includes("invalid") || rawMessage.includes("format")) {
        return "Some profile details are invalid. Please review and try again.";
    }

    return "Unable to complete setup. Please try again.";
}

export async function completeOnboardingAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const rawUsername = (formData.get("username") as string)?.trim() || "";
    const redirectUrl = (formData.get("redirectUrl") as string)?.trim() || "";
    const firstName = (formData.get("firstName") as string)?.trim() || "";
    const lastName = (formData.get("lastName") as string)?.trim() || "";
    const postOnboardingRedirectPath = getPostLoginRedirectPath(redirectUrl);

    if (!rawUsername) {
        return { error: "Username is required" };
    }

    const normalizedUsername = normalizeUsername(rawUsername);
    if (!normalizedUsername) {
        return {
            error: "Username can only contain lowercase letters, numbers, and dashes",
        };
    }

    if (normalizedUsername.length < 3) {
        return { error: "Username must be at least 3 characters" };
    }

    if (normalizedUsername.length > 30) {
        return { error: "Username must be less than 30 characters" };
    }

    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    if (user.status === "suspended") {
        redirect("/suspended");
    }

    if (user.username) {
        redirect(postOnboardingRedirectPath);
    }

    const existingUser = await fetchUserByUsername(normalizedUsername);
    if (existingUser && existingUser.id !== user.id) {
        return { error: "Username is already taken" };
    }

    try {
        await updateUserProfile(user.id, {
            username: normalizedUsername,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
        });

        await syncProfileToAuthProvider(user, {
            username: normalizedUsername,
            firstName,
            lastName: lastName || undefined,
        });
    } catch (error) {
        logger.error("Error completing onboarding", error);
        return { error: mapOnboardingErrorMessage(error) };
    }

    const userBasePath = getPublicProfilePath(normalizedUsername);
    revalidatePath("/app");
    revalidatePath(userBasePath);

    redirect(postOnboardingRedirectPath);
}
