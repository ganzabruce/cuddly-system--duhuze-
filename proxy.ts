import createIntlMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const NON_DEFAULT_LOCALES = routing.locales.filter((l) => l !== routing.defaultLocale);

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/admin(.*)",
  "/new(.*)",
  "/onboarding(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/suspended",
]);

const isNonIntlRoute = createRouteMatcher([
  "/app(.*)",
  "/admin(.*)",
  "/new(.*)",
  "/onboarding(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/suspended",
]);

function stripLocalePrefix(pathname: string): string | null {
  for (const locale of NON_DEFAULT_LOCALES) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return null;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) return;

  const stripped = stripLocalePrefix(pathname);
  if (stripped && isNonIntlRoute({ nextUrl: { pathname: stripped } } as typeof req)) {
    const url = req.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
    return;
  }

  if (isAuthRoute(req)) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!trpc|_next|_vercel|.*\\..*).*)", "/api/uploadthing(.*)"],
};
