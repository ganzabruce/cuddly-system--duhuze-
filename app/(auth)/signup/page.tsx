import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignupForm } from "@/components/auth/signup-form";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { redirect } from "next/navigation";
import { staticImages } from "@/public";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";

interface SignupPageProps {
  searchParams: Promise<{ error?: string; email?: string; redirect_url?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, email: initialEmail, redirect_url } = await searchParams;
  const postSignupRedirectPath = getPostLoginRedirectPath(redirect_url);

  const { userId } = await auth();
  if (userId) {
    redirect(postSignupRedirectPath);
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
          src={staticImages.signupCover}
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
              Create your first event in minutes.
            </h1>
            <p className="text-lg text-foreground/70">
              Invite guests, manage RSVPs, and send updates without the
              busywork. <br />
              Everything you need to plan beautifully, all in one place.
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
          <SignupForm
            initialError={errorMessage}
            initialEmail={initialEmail}
            redirectUrl={postSignupRedirectPath}
          />
        </div>
      </div>
    </div>
  );
}
