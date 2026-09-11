"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPVerificationForm } from "./otp-input";
import logger from "@/lib/utils/logger";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";

// Loading spinner component - memoized to prevent re-renders
const LoadingSpinner = React.memo(() => (
    <svg
        className="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
));
LoadingSpinner.displayName = "LoadingSpinner";

type SignupStep = "email" | "verification" | "profile";

interface SignupFormProps {
    initialError?: string | null;
    initialEmail?: string;
    redirectUrl?: string;
}

export function SignupForm({
    initialError,
    initialEmail,
    redirectUrl,
}: SignupFormProps) {
    const [step, setStep] = useState<SignupStep>("email");
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState(initialError || "");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [oauthTransferFailed, setOauthTransferFailed] = useState(false);
    const oauthTransferAttempted = useRef(false);
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const postSignupRedirectPath = useMemo(
        () => getPostLoginRedirectPath(redirectUrl),
        [redirectUrl],
    );
    const onboardingRedirect = useMemo(() => {
        if (postSignupRedirectPath === "/app/overview") {
            return "/onboarding";
        }

        return `/onboarding?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;
    }, [postSignupRedirectPath]);
    const loginHref = useMemo(() => {
        if (postSignupRedirectPath === "/app/overview") {
            return "/login";
        }

        return `/login?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;
    }, [postSignupRedirectPath]);
    const ssoCallbackUrl = useMemo(() => {
        if (postSignupRedirectPath === "/app/overview") {
            return "/signup/sso-callback";
        }

        return `/signup/sso-callback?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;
    }, [postSignupRedirectPath]);

    const isOAuthTransfer =
        isLoaded &&
        !!signUp &&
        !oauthTransferFailed &&
        signUp.status === "missing_requirements" &&
        signUp.verifications?.externalAccount?.status === "verified";

    useEffect(() => {
        if (!isOAuthTransfer || oauthTransferAttempted.current) return;
        oauthTransferAttempted.current = true;

        signUp.update({}).then(async (result) => {
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push(onboardingRedirect);
            } else {
                setOauthTransferFailed(true);
            }
        }).catch((err) => {
            logger.error("OAuth transfer completion error", err);
            const clerkErr = err as { errors?: Array<{ message: string }> };
            setError(clerkErr.errors?.[0]?.message || "Failed to complete Google sign up");
            setOauthTransferFailed(true);
        });
    }, [isOAuthTransfer, signUp, setActive, router, onboardingRedirect]);

    const handleGoogleSignUp = useCallback(async () => {
        if (!isLoaded || isGoogleLoading) return;

        setIsGoogleLoading(true);
        setError("");

        requestAnimationFrame(async () => {
            try {
                await signUp.authenticateWithRedirect({
                    strategy: "oauth_google",
                    redirectUrl: ssoCallbackUrl,
                    redirectUrlComplete: onboardingRedirect,
                });
            } catch (err) {
                logger.error("Google sign up error", err);
                const error = err as { errors?: Array<{ message: string }> };
                setError(error.errors?.[0]?.message || "Google sign up failed");
                setIsGoogleLoading(false);
            }
        });
    }, [isLoaded, isGoogleLoading, onboardingRedirect, signUp, ssoCallbackUrl]);

    const handleEmailSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!isLoaded) {
            setError("Authentication is not ready. Please try again.");
            setIsLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const emailValue = formData.get("email") as string;
        const firstNameValue = formData.get("firstName") as string;
        const lastNameValue = formData.get("lastName") as string;

        try {
            // Start the sign-up process without password (passwordless flow)
            const result = await signUp.create({
                emailAddress: emailValue,
                firstName: firstNameValue,
                lastName: lastNameValue,
            });

            if (result.status === "missing_requirements") {
                // Check if email verification is needed
                const unverifiedFields = result.unverifiedFields || [];

                if (unverifiedFields.includes("email_address")) {
                    // Prepare email verification
                    await signUp.prepareEmailAddressVerification({
                        strategy: "email_code",
                    });
                    setEmail(emailValue);
                    setStep("verification");
                } else {
                    // Other requirements - show what's missing
                    const missingFields = result.missingFields || [];
                    if (missingFields.length > 0) {
                        setError(`Missing required fields: ${missingFields.join(", ")}`);
                    } else {
                        setError("Additional information required. Please check your Clerk dashboard settings.");
                    }
                }
            } else if (result.status === "complete") {
                // If somehow complete (shouldn't happen with email verification enabled)
                await setActive({ session: result.createdSessionId });
                router.push(onboardingRedirect);
            } else {
                setError("Unable to start verification. Please try again.");
            }
        } catch (err) {
            logger.error("Signup error", err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(
                error.errors?.[0]?.message ||
                    "An error occurred during sign up. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, onboardingRedirect, signUp, setActive, router]);

    const handleVerificationSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!isLoaded || !signUp) {
            setError("Authentication is not ready. Please try again.");
            setIsLoading(false);
            return;
        }

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: otpCode,
            });

            if (result.status === "complete") {
                // Email verified, set session active
                await setActive({ session: result.createdSessionId });
                router.push(onboardingRedirect);
            } else if (result.status === "missing_requirements") {
                // Check what's missing
                const missingFields = result.missingFields || [];
                const unverifiedFields = result.unverifiedFields || [];

                if (missingFields.length > 0) {
                    setError(`Missing required fields: ${missingFields.join(", ")}`);
                } else if (unverifiedFields.length > 0) {
                    setError(`Please verify: ${unverifiedFields.join(", ")}`);
                } else {
                    // If no specific fields are listed, try to complete anyway
                    // This handles cases where the sign-up is actually ready
                    if (result.createdSessionId) {
                        await setActive({ session: result.createdSessionId });
                        router.push(onboardingRedirect);
                    } else {
                        setError("Additional verification required. Please try again.");
                    }
                }
            } else {
                setError("Verification failed. Please try again.");
            }
        } catch (err) {
            logger.error("Verification error", err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || "Invalid verification code");
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, signUp, otpCode, setActive, router, onboardingRedirect]);

    const handleResendCode = useCallback(async () => {
        if (!isLoaded || !signUp) return;

        setIsLoading(true);
        setError("");

        try {
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });
        } catch (err) {
            logger.error("Resend error", err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || "Failed to resend code");
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, signUp]);

    const handleBack = useCallback(() => {
        setStep("email");
        setOtpCode("");
        setError("");
    }, []);

    if (isOAuthTransfer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Completing Google sign up...</p>
                </div>
            </div>
        );
    }

    if (step === "verification") {
        return (
            <div className="w-full max-w-md">
                <OTPVerificationForm
                    title="Verify your email"
                    description={`Enter the 6-digit code sent to ${email}`}
                    value={otpCode}
                    onChange={setOtpCode}
                    onSubmit={handleVerificationSubmit}
                    onBack={handleBack}
                    onResend={handleResendCode}
                    isLoading={isLoading}
                    error={error}
                    length={6}
                />
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-4">
            {error && (
                <div className="rounded-md bg-destructive-surface border border-destructive/20 p-4">
                    <p className="text-destructive text-sm text-center">
                        {error}
                    </p>
                </div>
            )}

            <form onSubmit={handleEmailSubmit} className={cn("flex flex-col gap-6")}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-foreground">
                        Create an account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your details and we&apos;ll send you a verification code
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Name fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="firstName"
                                className="text-foreground"
                            >
                                First name
                            </Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="John"
                                required
                                autoComplete="given-name"
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="lastName"
                                className="text-foreground"
                            >
                                Last name
                            </Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                type="text"
                                placeholder="Doe"
                                required
                                autoComplete="family-name"
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-foreground">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            autoComplete="email"
                            defaultValue={initialEmail}
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Clerk CAPTCHA element for bot protection */}
                    <div id="clerk-captcha" className="min-h-0" />

                    <Button
                        type="submit"
                        variant="default"
                        className="w-full"
                        disabled={isLoading || !isLoaded || isGoogleLoading}
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                Sending code...
                            </>
                        ) : (
                            "Continue with email"
                        )}
                    </Button>

                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading || !isLoaded || isLoading}
                        type="button"
                    >
                        {isGoogleLoading ? (
                            <>
                                <LoadingSpinner />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <GoogleIcon className="mr-2 h-4 w-4" />
                                Continue with Google
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href={loginHref}
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}
