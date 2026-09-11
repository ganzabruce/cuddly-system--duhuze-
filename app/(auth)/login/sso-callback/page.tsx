import { getPostLoginRedirectPath, withRedirectUrl } from "@/lib/constants/auth/auth-redirect";
import { SSOCallbackHandler } from "@/components/auth/sso-callback-handler";

interface LoginSSOCallbackPageProps {
    searchParams: Promise<{ redirect_url?: string }>;
}

export default async function LoginSSOCallback({
    searchParams,
}: LoginSSOCallbackPageProps) {
    const { redirect_url } = await searchParams;
    const postLoginRedirectPath = getPostLoginRedirectPath(redirect_url);
    const signInUrl = withRedirectUrl("/login", redirect_url);
    const signUpUrl = withRedirectUrl("/signup", redirect_url);
    const signUpFallbackRedirectUrl = withRedirectUrl("/onboarding", redirect_url);
    const errorRedirectUrl = withRedirectUrl("/login?error=sso_failed", redirect_url);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <SSOCallbackHandler
                signInUrl={signInUrl}
                signUpUrl={signUpUrl}
                signInFallbackRedirectUrl={postLoginRedirectPath}
                signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
                errorRedirectUrl={errorRedirectUrl}
            />
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Completing sign in...</p>
            </div>
        </div>
    );
}
