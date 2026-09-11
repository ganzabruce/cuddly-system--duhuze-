import { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveInviteTokenAction } from "@/actions/guests/actions";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { stripHtml } from "@/lib/utils";
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
  const normalizedToken = normalizeOpaqueToken(token);
  const t = await getTranslations({ locale, namespace: "events.invite" });

  try {
    const resolved = await resolveInviteTokenAction({ username, eventSlug, token: normalizedToken });

    if (!resolved) {
      return {
        title: t("metaTitle"),
        description: t("metaDescription"),
      };
    }

    const { event } = resolved;
    const title = `${event.title} | Duhuze RSVP`;
    const description = (event.description ? stripHtml(event.description) : null) || t("invitedTo", { title: event.title });

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

export default async function InvitePage({ params }: Props) {
  const { username, eventSlug, token } = await params;
  const normalizedToken = normalizeOpaqueToken(token);
  const t = await getTranslations("events.invite");
  const resolved = await resolveInviteTokenAction({ username, eventSlug, token: normalizedToken });

  if (!resolved) {
    return (
      <TokenStatePage
        badge={t("invalidBadge")}
        title={t("invalidTitle")}
        description={t("invalidDescription")}
      />
    );
  }

  if (resolved.guest.inviteTokenState === "used") {
    return (
      <TokenStatePage
        badge={t("usedBadge")}
        title={t("usedTitle")}
        description={t("usedDescription")}
        eventTitle={resolved.event.title}
        token={normalizedToken}
        showResend
      />
    );
  }

  if (resolved.guest.inviteTokenState === "revoked") {
    return (
      <TokenStatePage
        badge={t("revokedBadge")}
        title={t("revokedTitle")}
        description={t("revokedDescription")}
        eventTitle={resolved.event.title}
      />
    );
  }

  if (resolved.guest.inviteTokenState === "expired") {
    return (
      <TokenStatePage
        badge={t("expiredBadge")}
        title={t("expiredTitle")}
        description={t("expiredDescription")}
        eventTitle={resolved.event.title}
        token={normalizedToken}
        showResend
      />
    );
  }

  const inviteToken = resolved.guest.inviteToken ?? normalizedToken;
  redirect(
    `${getPublicEventPath(username, eventSlug)}?inviteToken=${encodeURIComponent(inviteToken)}`,
  );
}
