"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";
import logger from "@/lib/utils/logger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPVerificationForm } from "@/components/auth/otp-input";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";

// Loading spinner component - memoized
const LoadingSpinner = () => (
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
);

type LoginStep = "email" | "verification";

interface LoginFormProps {
  initialError?: string | null;
  redirectUrl?: string;
}

export function LoginForm({ initialError, redirectUrl }: LoginFormProps) {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState(initialError || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const emailAddressIdRef = useRef<string | null>(null);
  const postLoginRedirectPath = useMemo(
    () => getPostLoginRedirectPath(redirectUrl),
    [redirectUrl],
  );
  const signupHref = useMemo(() => {
    if (postLoginRedirectPath === "/app/overview") {
      return "/signup";
    }
    return `/signup?redirect_url=${encodeURIComponent(postLoginRedirectPath)}`;
  }, [postLoginRedirectPath]);
  const ssoCallbackUrl = useMemo(() => {
    if (postLoginRedirectPath === "/app/overview") {
      return "/login/sso-callback";
    }

    return `/login/sso-callback?redirect_url=${encodeURIComponent(postLoginRedirectPath)}`;
  }, [postLoginRedirectPath]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded || isGoogleLoading) return;

    setIsGoogleLoading(true);
    setError("");

    requestAnimationFrame(async () => {
      try {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: postLoginRedirectPath,
        });
      } catch (err) {
        logger.error("Google sign in error", err);
        const error = err as { errors?: Array<{ message: string }> };
        setError(error.errors?.[0]?.message || "Google sign in failed");
        setIsGoogleLoading(false);
      }
    });
  }, [isLoaded, isGoogleLoading, postLoginRedirectPath, signIn, ssoCallbackUrl]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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

      try {
        // For passwordless login, we need to check if the user exists first
        // and then send them a sign-in link or OTP
        // Clerk's passwordless flow uses create() without strategy
        const result = await signIn.create({
          identifier: emailValue,
        });

        if (result.status === "needs_first_factor") {
          // Try to find email_code factor
          const emailCodeFactor = result.supportedFirstFactors?.find(
            (f) => f.strategy === "email_code",
          );

          if (emailCodeFactor && emailCodeFactor.emailAddressId) {
            // Store the emailAddressId for later use
            emailAddressIdRef.current = emailCodeFactor.emailAddressId;

            // Prepare email verification code
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailCodeFactor.emailAddressId,
            });
            setEmail(emailValue);
            setStep("verification");
          } else {
            // If email_code is not available, the account might be password-only
            setError(
              "This account requires a password to sign in. Please use Google sign-in or contact support.",
            );
          }
        } else if (result.status === "complete") {
          // If somehow complete
          await setActive({ session: result.createdSessionId });
          router.push(postLoginRedirectPath);
        } else {
          setError("Unable to start verification. Please try again.");
        }
      } catch (err) {
        logger.error("Login error", err);
        const error = err as { errors?: Array<{ message: string }> };
        setError(
          error.errors?.[0]?.message || "Invalid email or account not found",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoaded, signIn, setActive, router, postLoginRedirectPath],
  );

  const handleVerificationSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      if (!isLoaded || !signIn) {
        setError("Authentication is not ready. Please try again.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: otpCode,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          router.push(postLoginRedirectPath);
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
    },
    [isLoaded, signIn, otpCode, setActive, router, postLoginRedirectPath],
  );

  const handleResendCode = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError("");

    try {
      if (!emailAddressIdRef.current) {
        setError("Unable to resend code. Please try again.");
        setIsLoading(false);
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailAddressIdRef.current,
      });
    } catch (err) {
      logger.error("Resend error", err);
      const error = err as { errors?: Array<{ message: string }> };
      setError(error.errors?.[0]?.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn]);

  const handleBack = useCallback(() => {
    setStep("email");
    setOtpCode("");
    setError("");
    emailAddressIdRef.current = null;
  }, []);

  if (step === "verification") {
    return (
      <div className="w-full max-w-md">
        <OTPVerificationForm
          title="Check your email"
          description={`We sent a verification code to ${email}. Enter it below to sign in.`}
          value={otpCode}
          onChange={setOtpCode}
          onSubmit={handleVerificationSubmit}
          onBack={handleBack}
          onResend={handleResendCode}
          isLoading={isLoading}
          error={error}
          length={6}
          submitButtonText="Sign in"
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
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email to sign in with a verification code
          </p>
        </div>

        <div className="grid gap-6">
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
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={isLoading || !isLoaded}
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
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!isLoaded || isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <LoadingSpinner />
                Redirecting to Google...
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
          Don&apos;t have an account?{" "}
          <Link
            href={signupHref}
            className="text-primary hover:underline underline-offset-4"
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
