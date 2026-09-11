import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { getPostLoginRedirectPath } from "@/lib/constants/auth/auth-redirect";

interface EmailCallbackPageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function EmailCallback({
  searchParams,
}: EmailCallbackPageProps) {
  const { redirect_url } = await searchParams;
  const postSignupRedirectPath = getPostLoginRedirectPath(redirect_url);
  const signInUrl =
    postSignupRedirectPath === "/app/overview"
      ? "/login"
      : `/login?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;
  const signUpUrl =
    postSignupRedirectPath === "/app/overview"
      ? "/signup"
      : `/signup?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;
  const signUpFallbackRedirectUrl =
    postSignupRedirectPath === "/app/overview"
      ? "/onboarding"
      : `/onboarding?redirect_url=${encodeURIComponent(postSignupRedirectPath)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback
        signInUrl={signInUrl}
        signUpUrl={signUpUrl}
        signInFallbackRedirectUrl={postSignupRedirectPath}
        signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
      />
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign up...</p>
      </div>
    </div>
  );
}
