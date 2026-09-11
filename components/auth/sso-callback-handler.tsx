"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface SSOCallbackHandlerProps {
    signInUrl?: string;
    signUpUrl?: string;
    signInFallbackRedirectUrl?: string;
    signUpFallbackRedirectUrl?: string;
    errorRedirectUrl: string;
}

export function SSOCallbackHandler({
    errorRedirectUrl,
    signInUrl,
    signUpUrl,
    signInFallbackRedirectUrl,
    signUpFallbackRedirectUrl,
}: SSOCallbackHandlerProps) {
    const { handleRedirectCallback } = useClerk();
    const router = useRouter();
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        handleRedirectCallback({
            signInUrl,
            signUpUrl,
            signInFallbackRedirectUrl,
            signUpFallbackRedirectUrl,
        }).catch(() => {
            router.replace(errorRedirectUrl);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
