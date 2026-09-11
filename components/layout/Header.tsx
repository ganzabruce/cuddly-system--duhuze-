"use client";

import { usePathname, Link } from "@/i18n/navigation";
import NextLink from "next/link";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export interface HeaderProps {
  banner?: React.ReactNode;
}

const DASHBOARD_HREF = "/app/overview";
const headerButtonBase = "h-9 rounded-md px-4 text-sm";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function getIsScrolled() {
  return window.scrollY > 10;
}

function getIsScrolledServer() {
  return false;
}

export default function Header({ banner }: HeaderProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrolled = useSyncExternalStore(subscribeToScroll, getIsScrolled, getIsScrolledServer);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const navLinks = [
    { titleKey: "nav.explore", href: "/explore" },
    { titleKey: "nav.about", href: "/about" },
    { titleKey: "nav.pricing", href: "/pricing" },
    { titleKey: "nav.contact", href: "/contact" },
  ];

  const signedOutLinks = {
    login: { titleKey: "nav.login", href: "/login" },
    signup: { titleKey: "nav.signup", href: "/signup" },
  };

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-20 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-border bg-background/88 backdrop-blur-xl backdrop-saturate-[1.3]"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        {pathname === "/" && banner}
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
          aria-label="Global"
        >
          <Link href="/" className="flex items-center">
            <BrandLogo priority />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground md:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary dark:text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(link.titleKey)}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex md:items-center md:gap-2">
            <LocaleSwitcher />
            <SignedOut>
              <NextLink
                href={signedOutLinks.login.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  headerButtonBase,
                  "font-medium",
                )}
              >
                {t(signedOutLinks.login.titleKey)}
              </NextLink>
              <NextLink
                href={signedOutLinks.signup.href}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  headerButtonBase,
                  "font-semibold",
                )}
              >
                {t(signedOutLinks.signup.titleKey)}
              </NextLink>
            </SignedOut>
            <SignedIn>
              <ThemeToggle className="h-9 w-9 border border-border bg-background hover:border-accent/40 hover:bg-surface-raised" />
              <NextLink
                href={DASHBOARD_HREF}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  headerButtonBase,
                  "font-semibold",
                )}
              >
                {t("nav.dashboard")}
              </NextLink>
            </SignedIn>
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm overflow-y-auto border-l border-border/40 bg-background px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
                <BrandLogo />
              </Link>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="-m-2.5 rounded-md p-2.5 text-muted-foreground"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-8 flow-root">
              <div className="-my-6 divide-y divide-border/50">
                <div className="space-y-1 py-6">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <LocaleSwitcher />
                  </div>
                  {navLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "-mx-3 block rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted",
                          isActive
                            ? "text-primary dark:text-foreground font-semibold"
                            : "text-foreground",
                        )}
                        onClick={closeMobileMenu}
                      >
                        {t(link.titleKey)}
                      </Link>
                    );
                  })}
                </div>
                <div className="py-6">
                  <SignedOut>
                    <NextLink
                      href={signedOutLinks.login.href}
                      className="-mx-3 block rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={closeMobileMenu}
                    >
                      {t(signedOutLinks.login.titleKey)}
                    </NextLink>
                    <NextLink
                      href={signedOutLinks.signup.href}
                      className={cn(buttonVariants({ variant: "default" }), "mt-4 w-full justify-center")}
                      onClick={closeMobileMenu}
                    >
                      {t(signedOutLinks.signup.titleKey)}
                    </NextLink>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center gap-3">
                      <ThemeToggle className="border border-border bg-background hover:border-accent/40 hover:bg-surface-raised" />
                      <NextLink
                        href={DASHBOARD_HREF}
                        className={cn(buttonVariants({ variant: "default" }), "flex-1 justify-center")}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.dashboard")}
                      </NextLink>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
