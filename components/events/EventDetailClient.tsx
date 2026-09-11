"use client";

import { DeleteEventDialog } from "@/components/events/DeleteEventDialog";
import { EventSettingsDialog } from "@/components/events/EventSettingsDialog";
import { EventDetailRight } from "@/components/events/EventDetailRight";
import { EventDetailLeft } from "@/components/events/EventDetailLeft";
import { EventEditDialog } from "@/components/events/EventEditDialog";
import { EventWithdrawDialog } from "@/components/events/EventWithdrawDialog";
import { getAppBaseUrl, getAppDisplayHost } from "@/lib/utils/url";
import type { BillingFeatureAccess } from "@/lib/constants/billing/feature-access";
import type { DashboardEvent, DashboardGuest } from "@/types/events";
import { useEventDetailState } from "./useEventDetailState";

import type {
  EventPaymentHistoryItem,
  EventWithdrawalHistoryItem,
  EventFinanceSummary,
} from "./EventFinanceSection";

const baseUrl = getAppDisplayHost();

export function EventDetailClient({
  event,
  eventGuests,
  username,
  timeFormat,
  featureAccess,
  paymentHistory = [],
  withdrawalHistory = [],
  financeSummary,
  organizerPhone,
}: {
  event: DashboardEvent;
  eventGuests: DashboardGuest[];
  username: string;
  timeFormat: "12h" | "24h";
  featureAccess: BillingFeatureAccess;
  paymentHistory?: EventPaymentHistoryItem[];
  withdrawalHistory?: EventWithdrawalHistoryItem[];
  financeSummary?: EventFinanceSummary;
  organizerPhone?: string | null;
}) {
  const state = useEventDetailState({
    event,
    eventGuests,
    username,
    financeSummary,
  });
  const { localEvent } = state;

  return (
    <div className="grid grid-cols-1 gap-5 min-h-0 lg:grid-cols-[1fr_380px]">
      <div className="overflow-y-auto">
        <EventDetailLeft
          event={localEvent}
          eventDate={state.eventDate}
          countdown={state.countdown}
          guestStats={state.guestStats}
          eventGuests={eventGuests}
          eventPublicUrl={state.publicPath}
          hour12={timeFormat !== "24h"}
          featureAccess={featureAccess}
          onEdit={() => state.setIsEditing(true)}
          onSettings={() => state.setShowSettings(true)}
          paymentHistory={paymentHistory}
          withdrawalHistory={withdrawalHistory}
          financeSummary={financeSummary}
          onWithdraw={() => state.setShowWithdrawDialog(true)}
        />
      </div>

      <div className="lg:sticky lg:top-[73px] lg:self-start">
        <EventDetailRight
          image={localEvent.image}
          title={localEvent.title}
          baseUrl={baseUrl}
          username={username}
          currentSlug={localEvent.slug}
          editSlug={state.editSlug}
          onSlugChange={state.setEditSlug}
          onSaveSlug={state.handleSaveSlug}
          isSavingSlug={state.isSavingSlug}
          copied={state.copied}
          onCopyLink={state.handleCopyLink}
          onImageChange={state.handleImageChange}
          imageFormat={localEvent.imageFormat ?? "square"}
          publicUrl={`${getAppBaseUrl()}${state.publicPath}`}
          eventDate={state.eventDate}
          endDate={state.eventEndDate}
          timezone={localEvent.timezone}
          visibility={(localEvent.visibility as "public" | "private") ?? "private"}
        />
      </div>

      <EventEditDialog
        open={state.isEditing}
        onOpenChange={state.setIsEditing}
        event={localEvent}
        editVisibility={state.editVisibility}
        onEditVisibilityChange={state.setEditVisibility}
        formRef={state.editFormRef}
        timeFormat={timeFormat}
        isSavingEdit={state.isSavingEdit}
        onSave={state.handleSaveEdit}
        onDeleteRequested={() => state.setShowDeleteDialog(true)}
      />

      <EventSettingsDialog
        open={state.showSettings}
        onOpenChange={state.setShowSettings}
        event={localEvent}
        onSave={state.handleSaveSettings}
        featureAccess={featureAccess}
        organizerPhone={organizerPhone}
      />

      <DeleteEventDialog
        open={state.showDeleteDialog}
        onOpenChange={state.setShowDeleteDialog}
        onConfirm={state.handleDelete}
        isDeleting={state.isDeleting}
      />

      <EventWithdrawDialog
        open={state.showWithdrawDialog}
        onOpenChange={state.setShowWithdrawDialog}
        availableBalance={state.availableContributionBalance}
        currency={localEvent.currency ?? "RWF"}
        amount={state.withdrawAmount}
        onAmountChange={state.setWithdrawAmount}
        phone={state.withdrawPhone}
        onPhoneChange={state.setWithdrawPhone}
        isSubmitting={state.isRequestingWithdrawal}
        onSubmit={state.handleRequestWithdrawal}
        onReset={state.resetWithdrawalForm}
      />
    </div>
  );
}
