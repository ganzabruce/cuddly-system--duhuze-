import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon } from "@/public";
import { BrandLogo } from "@/components/layout/BrandLogo";
import contactContent from "@/components/marketing/contact-content.json";

const footerLinks = {
    product: [
        { labelKey: "footer.about", href: "/about" },
        { labelKey: "footer.pricing", href: "/pricing" },
        { labelKey: "footer.explore", href: "/explore" },
    ],
    resources: [
        { labelKey: "footer.faq", href: "/faq" },
        { labelKey: "footer.support", href: "/support" },
        { labelKey: "footer.contact", href: "/contact" },
        { labelKey: "footer.feedback", href: "https://tally.so/r/lbRqxp", external: true },
    ],
    legal: [
        { labelKey: "footer.privacy", href: "/privacy" },
        { labelKey: "footer.terms", href: "/terms" },
    ],
};

const socialIcons = {
    instagram: InstagramIcon,
    tiktok: TikTokIcon,
    facebook: FacebookIcon,
    linkedin: LinkedInIcon,
} as const;

function isSocialIcon(icon: string): icon is keyof typeof socialIcons {
    return icon in socialIcons;
}

export default async function Footer() {
    const t = await getTranslations("common");
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative w-full border-t border-border/50">
            <div className="mx-auto max-w-7xl px-5 pt-14 pb-10 sm:px-8 lg:pt-16 lg:pb-12">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-16">

                    <div>
                        <Link href="/" className="inline-flex items-center">
                            <BrandLogo />
                        </Link>
                        <p className="mt-4 max-w-60 text-sm leading-relaxed text-muted-foreground">
                            {t("footer.tagline")}
                        </p>

                        <div className="mt-5 flex items-center gap-3">
                            {contactContent.socials.map((social) => {
                                if (!isSocialIcon(social.icon)) {
                                    return null;
                                }

                                const Icon = socialIcons[social.icon];

                                return (
                                    <a
                                        key={social.platform}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="flex h-10 w-10 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-all duration-200 hover:border-accent/50 hover:text-accent"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                            {t("footer.product")}
                        </h3>
                        <ul className="space-y-2.5">
                            {footerLinks.product.map((link) => (
                                <li key={link.labelKey}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                            {t("footer.resources")}
                        </h3>
                        <ul className="space-y-2.5">
                            {footerLinks.resources.map((link) => (
                                <li key={link.labelKey}>
                                    <Link
                                        href={link.href}
                                        target={link.external ? "_blank" : undefined}
                                        rel={link.external ? "noopener noreferrer" : undefined}
                                        className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                            {t("footer.legal")}
                        </h3>
                        <ul className="space-y-2.5">
                            {footerLinks.legal.map((link) => (
                                <li key={link.labelKey}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

              <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/30 pt-6 sm:flex-row">
                    <p className="text-xs tracking-wide text-muted-foreground/75">
                    {t("footer.copyright", { year: currentYear })}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground/75">
                        {t("footer.builtBy")}
                      </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
