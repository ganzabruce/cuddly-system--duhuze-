"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/app/overview"
            signUpFallbackRedirectUrl="/onboarding"
            afterSignOutUrl="/"
        >
            {children}
        </ClerkProvider>
    );
}
