import NextTopLoader from "nextjs-toploader";

export function AppTopLoader() {
    return (
        <NextTopLoader
        color="var(--foreground)"
            height={4}
            showSpinner={false}
            shadow={false}
        />
    );
}
