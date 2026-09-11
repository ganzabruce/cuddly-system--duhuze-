import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { HeroPattern } from "@/components/marketing/home/HeroPattern";
import { default as Footer } from "@/components/layout/Footer";
import { default as Header } from "@/components/layout/Header";

export function MaintenanceScreen({
    message = "We're currently performing maintenance. Please try again in a few moments.",
}: {
    message?: string;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
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
                <div className="relative z-10 max-w-2xl text-center">
                    <p className="font-display text-6xl font-extrabold tracking-tight text-foreground/20 sm:text-8xl">
                        503
                    </p>
                    <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                        We&apos;ll Be Right Back
                    </h1>
                    <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                        {message}
                    </p>
                    <Link
                        href="."
                        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Try again
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
