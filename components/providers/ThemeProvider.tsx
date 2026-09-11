"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

type Theme = "light" | "dark" | "system";

export function ThemeProvider({
    children,
    defaultTheme,
}: {
    children: React.ReactNode;
    /** Optional initial theme from DB to avoid flash on load when user has a saved preference. */
    defaultTheme?: Theme;
}) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme={defaultTheme ?? "system"}
            enableSystem
            storageKey="Duhuze RSVP-theme"
            disableTransitionOnChange={false}
        >
            {children}
        </NextThemesProvider>
    );
}
