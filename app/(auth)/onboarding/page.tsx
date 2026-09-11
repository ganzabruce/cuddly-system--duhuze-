import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getClerkUserNames } from "@/lib/services/auth/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getAppBaseUrl } from "@/lib/utils/url";
import { DbDependencyError } from "@/lib/db/errors";
import { MaintenanceScreen } from "@/components/ui/errors/MaintenanceScreen";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { staticImages } from "@/public";
import { getPostLoginRedirectPath, withRedirectUrl } from "@/lib/constants/auth/auth-redirect";

interface OnboardingPageProps {
    searchParams: Promise<{ error?: string; redirect_url?: string }>;
}

export default async function OnboardingPage({
    searchParams,
}: OnboardingPageProps) {
    const { error, redirect_url } = await searchParams;
    const postOnboardingRedirectPath = getPostLoginRedirectPath(redirect_url);
    let user;
    let firstName = "";
    let lastName = "";
    try {
        user = await getCurrentUser();
        const names = await getClerkUserNames();
        firstName = names.firstName;
        lastName = names.lastName;
    } catch (error) {
        if (error instanceof DbDependencyError) {
            return <MaintenanceScreen />;
        }
        throw error;
    }

    if (!user) {
        redirect(withRedirectUrl("/login", postOnboardingRedirectPath));
    }
    if (user.status === "suspended") {
        redirect("/suspended");
    }
    if (user.username) {
        redirect(postOnboardingRedirectPath);
    }

    const appHost = new URL(getAppBaseUrl()).host;

    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-background">
            {/* Left side — image + branding */}
            <div className="relative hidden lg:flex flex-col overflow-hidden">
                <Image
                    src={staticImages.signupCover}
                    alt="Event management"
                    fill
                    className="object-cover object-center opacity-50"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/50" />

                <div className="relative z-10 flex flex-col h-full p-10">
                    {/* Logo */}
                    <Link href="/" className="flex w-fit items-center">
                        <BrandLogo alt="Duhuze RSVP" className="h-10 w-auto" priority />
                    </Link>

                    {/* Copy */}
                    <div className="flex flex-1 flex-col justify-center">
                        <p className="text-sm font-semibold tracking-widest uppercase text-foreground/50 mb-3">
                            Almost there
                        </p>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                            Make it yours.
                        </h1>
                        <p className="text-lg text-foreground/70 mb-8">
                            One last step — choose a username and we&apos;ll have
                            your profile ready to go.
                        </p>

                        <ul className="space-y-3 text-sm text-foreground/60">
                            <li className="flex items-center gap-2.5">
                                <span className="size-5 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 shrink-0">
                                    <svg viewBox="0 0 16 16" className="size-3 fill-current"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                                </span>
                                Your personal link: <strong className="text-foreground/80 font-medium">{appHost}/yourname</strong>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <span className="size-5 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 shrink-0">
                                    <svg viewBox="0 0 16 16" className="size-3 fill-current"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                                </span>
                                Event management dashboard
                            </li>
                            <li className="flex items-center gap-2.5">
                                <span className="size-5 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 shrink-0">
                                    <svg viewBox="0 0 16 16" className="size-3 fill-current"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                                </span>
                                Guest tracking & RSVP management
                            </li>
                        </ul>
                    </div>

                    <p className="text-sm text-foreground/40">
                        &copy; {new Date().getFullYear()} Duhuze RSVP. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right side — form */}
            <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
                {/* Mobile logo */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Link href="/" className="flex w-fit items-center">
                        <BrandLogo alt="Duhuze RSVP" className="h-10 w-auto" />
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <OnboardingForm
                        initialError={error}
                        profileHost={appHost}
                        redirectUrl={postOnboardingRedirectPath}
                        firstName={firstName}
                        lastName={lastName}
                    />
                </div>
            </div>
        </div>
    );
}
