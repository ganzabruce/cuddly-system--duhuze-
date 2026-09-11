import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Link from "next/link";
import { default as Footer } from "@/components/layout/Footer";
import { default as Header } from "@/components/layout/Header";
import { Banner, BannerAction } from "@/components/ui/banner";
import { getActiveSiteAnnouncementAction } from "@/actions/admin/announcements";
import { routing } from "@/i18n/routing";

export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const announcement = await getActiveSiteAnnouncementAction();

  const banner = announcement ? (
    <Banner
      variant={announcement.variant}
      storageKey={`announcement-${announcement.id}-dismissed`}
    >
      {announcement.message}
      {announcement.linkText && announcement.linkHref && (
        <BannerAction render={<Link href={announcement.linkHref} />}>
          {announcement.linkText}
        </BannerAction>
      )}
    </Banner>
  ) : null;

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Header banner={banner} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
