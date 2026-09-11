"use client";

import { useState, useCallback } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { SiteSection } from "@/components/marketing/shared/SiteSection";

export function CTA() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const t = useTranslations("marketing");

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isLoaded) return;
      setIsLoading(true);
      setError("");

      try {
        await signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_link",
          redirectUrl: window.location.origin + "/signup/email-callback",
        });
        setStep("sent");
      } catch (err) {
        const clerkError = err as { errors?: Array<{ message: string; code?: string }> };
        const firstError = clerkError.errors?.[0];

        if (
          firstError?.code === "form_param_missing" ||
          firstError?.message?.toLowerCase().includes("first name") ||
          firstError?.message?.toLowerCase().includes("last name")
        ) {
          router.push(`/signup?email=${encodeURIComponent(email)}`);
          return;
        }

        setError(firstError?.message ?? "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoaded, signUp, email, router],
  );

  return (
    <SiteSection background="secondary">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="site-h2 font-display text-balance text-foreground">
          {t("cta.heading1")}{" "}
          <span className="site-accent">{t("cta.headingAccent")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("cta.subtext")}
          <br />
          {t("cta.subtextLine2")}
        </p>

        <div className="mt-10">
          {step === "email" ? (
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex w-full max-w-md items-center overflow-hidden rounded-md border border-border bg-background py-1.5 pl-5 pr-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("cta.emailPlaceholder")}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    t("cta.sending")
                  ) : (
                    <>
                      {t("cta.getStarted")}
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {t("cta.checkInbox")}{" "}
                <strong className="text-foreground">{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("cta.wrongEmail")}
              </button>
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-muted-foreground/60">
          {t("cta.footerNote")}
        </p>
      </div>
    </SiteSection>
  );
}
