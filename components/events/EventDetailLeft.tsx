"use client";

import { EventHeader } from "./EventHeader";
import { GuestManager } from "./GuestManager";
import {
  EventFinanceSection,
  type EventPaymentHistoryItem,
  type EventWithdrawalHistoryItem,
  type EventFinanceSummary,
} from "./EventFinanceSection";
import type { BillingFeatureAccess } from "@/lib/constants/billing/feature-access";
import type { DashboardEvent, DashboardGuest } from "@/types/events";
import type { GuestStats } from "@/types/guests";

interface EventDetailLeftProps {
  event: DashboardEvent;
  eventDate: Date;
  countdown: { label: string; tone: string };
  guestStats: GuestStats;
  eventGuests: DashboardGuest[];
  eventPublicUrl: string;
  hour12: boolean;
  featureAccess: BillingFeatureAccess;
  onEdit: () => void;
  onSettings: () => void;
  // Finance
  paymentHistory?: EventPaymentHistoryItem[];
  withdrawalHistory?: EventWithdrawalHistoryItem[];
  financeSummary?: EventFinanceSummary;
  onWithdraw: () => void;
}

export function EventDetailLeft({
  event,
  eventDate,
  countdown,
  guestStats,
  eventGuests,
  eventPublicUrl,
  hour12,
  featureAccess,
  onEdit,
  onSettings,
  paymentHistory = [],
  withdrawalHistory = [],
  financeSummary,
  onWithdraw,
}: EventDetailLeftProps) {
  const showFinance =
    featureAccess.eventContributions &&
    (event.contributionCollectionMode === "platform" || event.contributionCollectionMode === "optional") &&
    !!financeSummary;

  return (
    <div className="flex flex-col gap-10">
      <EventHeader
        event={event}
        eventDate={eventDate}
        countdown={countdown}
        guestStats={guestStats}
        hour12={hour12}
        onEdit={onEdit}
        onSettings={onSettings}
      />

      {showFinance && (
        <EventFinanceSection
          summary={financeSummary!}
          payments={paymentHistory}
          withdrawals={withdrawalHistory}
          currency={event.currency ?? "RWF"}
          onWithdraw={onWithdraw}
        />
      )}

      <GuestManager
        eventGuests={eventGuests}
        eventName={event.title}
        eventId={event.id}
        eventSlug={event.slug}
        eventPublicUrl={eventPublicUrl}
        hour12={hour12}
        featureAccess={featureAccess}
        whatsappEnabled={event.whatsappEnabled ?? false}
      />
    </div>
  );
}
