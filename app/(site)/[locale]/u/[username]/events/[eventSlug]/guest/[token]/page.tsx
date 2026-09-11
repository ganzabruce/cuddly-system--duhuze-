import { Metadata } from "next";
import { stripHtml } from "@/lib/utils";
import {
  getGuestConfirmationData,
  getGuestConfirmationMetadata,
} from "@/actions/rsvp/get-guest-confirmation-data";
import { GuestConfirmationClient } from "@/components/rsvp/GuestConfirmationClient";
import { TokenStatePage } from "@/components/rsvp/TokenStatePage";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; username: string; eventSlug: string; token: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string; eventSlug: string; token: string }>;
}): Promise<Metadata> {
  const { locale, username, eventSlug, token } = await params;
  const t = await getTranslations({ locale, namespace: "events.guest" });
  const tPublic = await getTranslations({ locale, namespace: "events.publicEvent" });

  try {
    const resolved = await getGuestConfirmationMetadata(token, { username, eventSlug });

    if (!resolved) {
      return {
        title: t("metaTitle"),
        description: t("metaDescription"),
      };
    }

    const { event } = resolved;
    const title = `${event.title} | Duhuze RSVP`;
    const description = (event.description ? stripHtml(event.description) : null) || tPublic("confirmAttendance", { title: event.title });

    return {
      title,
      description,
      openGraph: {
        title: event.title,
        description,
        type: "website",
        images: event.image ? [event.image] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description,
        images: event.image ? [event.image] : [],
      },
    };
  } catch {
    return {
      title: t("metaTitle"),
      description: t("metaDescription"),
    };
  }
}

export default async function GuestConfirmationPage({ params }: Props) {
  const { username, eventSlug, token } = await params;
  const t = await getTranslations("events.guest");

  const result = await getGuestConfirmationData(token, { username, eventSlug });

  if (result.status === "invalid") {
    return (
      <TokenStatePage
        badge={t("invalidBadge")}
        title={t("invalidTitle")}
        description={t("invalidDescription")}
      />
    );
  }

  if (result.status === "unavailable") {
    return (
      <TokenStatePage
        badge={t("unavailableBadge")}
        title={result.eventTitle}
        description={t("unavailableDescription")}
      />
    );
  }

  const { guest, event, settings, additionalGuests, useHour12, token: effectiveToken, hasPaid, pendingPayment } = result;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_90%_at_50%_-20%,var(--primary)/0.08),var(--background)]" aria-hidden />
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <GuestConfirmationClient
          guest={guest}
          event={event}
          settings={settings}
          additionalGuests={additionalGuests}
          useHour12={useHour12}
          token={effectiveToken}
          hasPaid={hasPaid}
          pendingPayment={pendingPayment}
        />
      </main>
    </div>
  );
}
