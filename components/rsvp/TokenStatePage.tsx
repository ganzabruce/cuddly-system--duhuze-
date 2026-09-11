"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { default as Header } from "@/components/layout/Header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { requestInviteResend } from "@/actions/rsvp/request-invite-resend";

export function TokenStatePage({
  badge,
  title,
  description,
  token,
  showResend = false,
}: {
  badge: string;
  title: string;
  description: string;
  eventTitle?: string;
  token?: string;
  showResend?: boolean;
}) {
  const t = useTranslations("events.tokenState");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    if (!token) return;
    startTransition(async () => {
      await requestInviteResend(token);
      setSent(true);
    });
  }

  const displayBadge = sent ? t("emailSentBadge") : badge;
  const displayTitle = sent ? t("emailSentTitle") : title;
  const displayDescription = sent ? t("emailSentDescription") : description;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 sm:px-6 py-16 sm:py-24 lg:py-32 lg:px-8">
        <div className="opacity-20">
          <HeroPattern />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(213,176,57,0.05) 0%, transparent 100%)",
          }}
        />
        <div className="relative z-10 text-center max-w-2xl">
          <p className="site-eyebrow">{displayBadge}</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
            {displayTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            {displayDescription}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 [&>*]:w-full [&>*]:sm:w-48">
            {showResend && token && !sent ? (
              <Button
                variant="default"
                size="lg"
                onClick={handleResend}
                disabled={isPending}
              >
                {isPending ? t("sending") : t("requestNewLink")}
              </Button>
            ) : null}
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
