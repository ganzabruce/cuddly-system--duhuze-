import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { redirect } from "next/navigation";
import { staticImages } from "@/public";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirect_url?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, redirect_url } = await searchParams;
  const postLoginRedirectPath = getPostLoginRedirectPath(redirect_url);

  const { userId } = await auth();
  if (userId) {
    redirect(postLoginRedirectPath);
  }

  const errorMessages: Record<string, string> = {
    sso_failed: "Sign in with Google failed. Please try again or use email.",
    oauth_error: "Authentication failed. Please try again.",
  };

  const errorMessage = error
    ? errorMessages[error] || "An error occurred. Please try again."
    : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      {/* Left side - Background image with theme-aware overlay */}
      <div className="relative hidden lg:flex flex-col overflow-hidden">
        {/* Background image */}
        <Image
          src={staticImages.actionMoment}
          alt="Event management dashboard preview"
          fill
          className="object-cover object-center opacity-50"
          priority
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/50" />

        {/* Content on top of overlay */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link href="/" className="flex w-fit items-center">
            <BrandLogo alt="Duhuze RSVP" className="h-10 w-auto" priority />
          </Link>

          {/* Tagline */}
          <div className="flex flex-1 flex-col justify-center px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Welcome back to Duhuze RSVP.
            </h1>
            <p className="text-lg text-foreground/70">
              Pick up where you left off—manage events, track RSVPs, and stay on
              schedule. <br />
              Keep every guest in sync with a single, simple dashboard.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-foreground/50">
            &copy; {new Date().getFullYear()} Duhuze RSVP. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
        {/* Mobile logo (shown only when left panel is hidden) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" className="flex w-fit items-center">
            <BrandLogo alt="Duhuze RSVP" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <LoginForm
            initialError={errorMessage}
            redirectUrl={postLoginRedirectPath}
          />
        </div>
      </div>
    </div>
  );
}
