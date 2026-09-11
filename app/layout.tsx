import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getAppBaseUrl } from "@/lib/utils/url";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProviderWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
import { PWAInstallProvider } from "@/components/providers/PWAInstallProvider";
import { Toaster } from "@/components/ui/sonner";
import { brandIcons } from "@/public";
import { getLocale, getTranslations } from "next-intl/server";

const OG_LOCALES: Record<string, string> = { en: "en_US", fr: "fr_FR" };

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
        { media: "(prefers-color-scheme: dark)", color: "#090909" },
    ],
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "metadata" });
    const baseUrl = getAppBaseUrl();

    return {
        metadataBase: new URL(baseUrl),
        applicationName: "Duhuze RSVP",
        manifest: '/manifest.json',
        appleWebApp: {
            capable: true,
            statusBarStyle: 'black-translucent',
            title: 'Duhuze RSVP',
        },
        title: t("home.title"),
        description: t("home.description"),
        keywords: [
            "event management",
            "RSVP",
            "invitations",
            "guest list",
            "party planning",
            "event planning",
            "wedding RSVP",
            "event tracker",
        ],
        authors: [{ name: "Duhuze RSVP" }],
        creator: "Izyo Digital Ltd",
        openGraph: {
            type: "website",
            locale: OG_LOCALES[locale] ?? "en_US",
            url: baseUrl,
            siteName: "Duhuze RSVP",
            title: t("home.title"),
            description: t("home.description"),
        },
        twitter: {
            card: "summary_large_image",
            title: t("home.title"),
            description: t("home.description"),
            creator: "@duhuze",
        },
        robots: {
            index: true,
            follow: true,
        },
        icons: {
            icon: [
                {
                    url: brandIcons.maskedLight,
                    media: "(prefers-color-scheme: light)",
                    type: "image/png",
                    sizes: "512x512",
                },
                {
                    url: brandIcons.maskedDark,
                    media: "(prefers-color-scheme: dark)",
                    type: "image/png",
                },
            ],
            shortcut: [
                {
                    url: brandIcons.maskedLight,
                    media: "(prefers-color-scheme: light)",
                    type: "image/png",
                },
                {
                    url: brandIcons.maskedDark,
                    media: "(prefers-color-scheme: dark)",
                    type: "image/png",
                    sizes: "512x512",
                },
            ],
        },
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    return (
        <html
            lang={locale}
            className="scroll-smooth"
            suppressHydrationWarning={true}
        >
            <body
                className="font-sans antialiased bg-background text-foreground"
                suppressHydrationWarning={true}
            >
                <script
                    dangerouslySetInnerHTML={{
                        __html: `if(typeof performance!=='undefined'&&performance.measure){var m=performance.measure.bind(performance);performance.measure=function(n,s,e){try{return e!==undefined?m(n,s,e):m(n,s)}catch(err){if(String(err).indexOf('negative time stamp')!==-1)return;throw err}}}`,
                    }}
                />
                <ClerkProviderWrapper>
                    <ThemeProvider>
                        <PWAInstallProvider>
                            {children}
                            <Toaster position="top-right" richColors />
                            <ServiceWorkerRegistrar />
                        </PWAInstallProvider>
                    </ThemeProvider>
                </ClerkProviderWrapper>
            </body>
        </html>
    );
}
