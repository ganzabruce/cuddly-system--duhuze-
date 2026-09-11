"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRsvpByToken } from "@/actions/rsvp/update-rsvp-by-token";
import type { PaymentMethodType } from "@/types/billing";
import type { ImageFormat } from "@/types/events";
import { EventDateBadge, EventLocation, EventTitle } from "@/components/events/EventDetails";
import {
  getPrimaryAttendeeCategory,
  normalizeAttendeeCategories,
  normalizeCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import { GuestEventSidebar } from "./GuestEventSidebar";
import { RsvpUpdateCard } from "./RsvpUpdateCard";

type Guest = {
  id: number;
  name: string;
  email: string | null;
  rsvpStatus: "yes" | "no" | "maybe" | null;
  rsvpNote: string | null;
  additionalGuestCount: number;
  customQuestionResponses?: Record<string, string> | null;
};

type EventInfo = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  imageFormat?: ImageFormat;
  date: Date;
  endDate: Date | null;
  timezone: string;
  locationName: string;
  locationLink: string | null;
  username: string;
  slug: string;
  status: "published" | "completed" | "draft" | "cancelled";
};

type AdditionalGuest = {
  id: number;
  name: string | null;
  email: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  sortOrder: number;
};

type CapacityInfo = {
  guestCapacity: number | null;
  allowAdditionalGuests: boolean;
  maxAdditionalGuests: number;
  totalSeatsUsed: number;
  atCapacity: boolean;
  customQuestions: unknown;
  attendeeCategories: unknown;
  contributionPaymentInfo: string | null;
  contributionAmount: number | null;
  currency: string;
  collectionMode?: "offline" | "platform" | "optional";
};

type PendingPayment = {
  id: number;
  requestTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: "mobile_money";
  payerPhone?: string | null;
};

import type {
  AdditionalGuestDraft,
  PaymentBreakdownLine,
} from "@/types/events";

export function GuestConfirmationClient({
  guest,
  event,
  settings,
  additionalGuests,
  useHour12,
  token,
  hasPaid: initialHasPaid = false,
  pendingPayment: initialPendingPayment = null,
}: {
  guest: Guest;
  event: EventInfo;
  settings: CapacityInfo;
  additionalGuests: AdditionalGuest[];
  useHour12: boolean;
  token: string;
  hasPaid?: boolean;
  pendingPayment?: PendingPayment | null;
}) {
  const router = useRouter();
  const normalizedQuestions = useMemo(
    () => normalizeCustomQuestions(settings.customQuestions),
    [settings.customQuestions],
  );
  const attendeeCategories = useMemo(
    () => normalizeAttendeeCategories(settings.attendeeCategories),
    [settings.attendeeCategories],
  );
  const primaryCategory = useMemo(
    () => getPrimaryAttendeeCategory(attendeeCategories),
    [attendeeCategories],
  );

  const initialStatus = guest.rsvpStatus ?? "maybe";
  const [rsvpStatus, setRsvpStatus] = useState<"yes" | "no" | "maybe">(
    initialStatus,
  );
  const [rsvpNote, setRsvpNote] = useState(guest.rsvpNote ?? "");
  const [additionalGuestCount, setAdditionalGuestCount] = useState(
    guest.additionalGuestCount ?? 0,
  );
  const [rsvpErrors, setRsvpErrors] = useState<{
    rsvpStatus?: string;
    rsvpNote?: string;
    additionalGuestCount?: string;
    customQuestions?: string;
  }>({});
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"yes" | "no" | "maybe">(
    initialStatus,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>(
      "mtn_momo",
    );
  const [payerPhone, setPayerPhone] = useState(
    initialPendingPayment?.payerPhone ?? "",
  );
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(
    initialPendingPayment,
  );
  const [hasPaid, setHasPaid] = useState(initialHasPaid);
  const isPlatformPayment = settings.collectionMode === "platform";
  const isOptionalPayment = settings.collectionMode === "optional";
  const [wantsToContribute, setWantsToContribute] = useState(true);
  const [customOptionalAmount, setCustomOptionalAmount] = useState<number | undefined>(undefined);

  const sortedAdditionalGuests = useMemo(
    () => [...additionalGuests].sort((a, b) => a.sortOrder - b.sortOrder),
    [additionalGuests],
  );
  const [additionalGuestDrafts, setAdditionalGuestDrafts] = useState<
    AdditionalGuestDraft[]
  >(
    Array.from({ length: Math.max(guest.additionalGuestCount ?? 0, 0) }, (_, i) => ({
      name: sortedAdditionalGuests[i]?.name ?? "",
      email: sortedAdditionalGuests[i]?.email ?? null,
      categoryId:
        sortedAdditionalGuests[i]?.categoryId ??
        attendeeCategories[0]?.id ??
        "",
    })),
  );
  const [customQuestionResponses, setCustomQuestionResponses] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const question of normalizedQuestions) {
      initial[question.id] = guest.customQuestionResponses?.[question.id] ?? "";
    }
    return initial;
  });

  const eventDate = useMemo(() => new Date(event.date), [event.date]);
  const eventEndDate = useMemo(
    () => (event.endDate ? new Date(event.endDate) : null),
    [event.endDate],
  );
  const [renderedAt] = useState(() => Date.now());
  const canEditRsvp = renderedAt < new Date(eventEndDate ?? eventDate).getTime();

  const guestHoldsASeat = savedStatus === "yes";
  const yesIsDisabled = settings.atCapacity && !guestHoldsASeat;

  const handleAdditionalGuestCountChange = (count: number) => {
    const safeCount = Math.max(0, Math.min(settings.maxAdditionalGuests, count));
    setAdditionalGuestCount(safeCount);
    setAdditionalGuestDrafts((previous) =>
      Array.from({ length: safeCount }, (_, index) => ({
        name: previous[index]?.name ?? "",
        email: previous[index]?.email ?? null,
        categoryId:
          previous[index]?.categoryId ?? attendeeCategories[0]?.id ?? "",
      })),
    );
  };

  const handleAdditionalGuestDraftChange = (
    index: number,
    field: keyof AdditionalGuestDraft,
    value: string,
  ) => {
    setAdditionalGuestDrafts((previous) => {
      const next = [...previous];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const paymentBreakdown = useMemo<PaymentBreakdownLine[]>(() => {
    if (rsvpStatus !== "yes") {
      return [];
    }

    if (attendeeCategories.length > 0) {
      const counts = new Map<string, number>();
      if (primaryCategory) {
        counts.set(primaryCategory.id, 1);
      }

      additionalGuestDrafts.slice(0, additionalGuestCount).forEach((draft) => {
        if (!draft.categoryId) return;
        counts.set(draft.categoryId, (counts.get(draft.categoryId) ?? 0) + 1);
      });

      return attendeeCategories
        .map((category) => {
          const count = counts.get(category.id) ?? 0;
          if (count === 0) return null;
          return {
            label: category.label,
            count,
            contributionAmount: category.contributionAmount,
            subtotalAmount: category.contributionAmount * count,
          };
        })
        .filter((line): line is PaymentBreakdownLine => line !== null);
    }

    if (isOptionalPayment) {
      const totalAmount = customOptionalAmount ?? 0;
      if (totalAmount <= 0) {
        return [];
      }

      return [
        {
          label: "Guests",
          count: 1,
          contributionAmount: totalAmount,
          subtotalAmount: totalAmount,
        },
      ];
    }

    const amountPerPerson = settings.contributionAmount ?? 0;
    if (amountPerPerson <= 0) {
      return [];
    }

    return [
      {
        label: "Guests",
        count: 1 + additionalGuestCount,
        contributionAmount: amountPerPerson,
        subtotalAmount: amountPerPerson * (1 + additionalGuestCount),
      },
    ];
  }, [
    additionalGuestCount,
    additionalGuestDrafts,
    attendeeCategories,
    customOptionalAmount,
    isOptionalPayment,
    primaryCategory,
    rsvpStatus,
    settings.contributionAmount,
  ]);

  const handleSaveRsvp = async () => {
    setIsSavingRsvp(true);
    setRsvpErrors({});

    const hasPayableAmount = !isOptionalPayment || (customOptionalAmount ?? 0) > 0;
    const isStartingPayment =
      (isPlatformPayment || (isOptionalPayment && wantsToContribute)) &&
      rsvpStatus === "yes" &&
      !hasPaid &&
      hasPayableAmount;

    const result = await updateRsvpByToken(token, {
      rsvpStatus,
      rsvpNote,
      customQuestionResponses,
      additionalGuestCount:
        settings.allowAdditionalGuests && rsvpStatus === "yes"
          ? additionalGuestCount
          : 0,
      additionalGuests:
        settings.allowAdditionalGuests && rsvpStatus === "yes"
          ? additionalGuestDrafts.slice(0, additionalGuestCount)
          : [],
      payerPhone: isStartingPayment ? payerPhone : undefined,
      paymentIntent: isStartingPayment ? "start" : "none",
      optionalContributionAmount:
        isOptionalPayment && wantsToContribute ? customOptionalAmount : undefined,
    });

    setIsSavingRsvp(false);

    if (!result.success) {
      setRsvpErrors(result.errors ?? {});
      toast.error(result.message);
      return;
    }

    if (result.paymentPending && result.payment) {
      setPendingPayment(result.payment);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
      return;
    }

    setSavedStatus(rsvpStatus);
    toast.success(result.message);
  };

  return (
    <div className="grid gap-6 pt-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8">
      <GuestEventSidebar
        event={event}
        rsvpStatus={savedStatus}
        guestName={guest.name}
        guestEmail={guest.email}
      />

      <div className="space-y-5">
        <EventTitle title={event.title} description={event.description} />
        <div className="space-y-3 py-2">
          <EventDateBadge date={eventDate} endDate={eventEndDate} useHour12={useHour12} timezone={event.timezone} />
          <EventLocation
            locationName={event.locationName}
            locationLink={event.locationLink}
          />
        </div>

        <RsvpUpdateCard
          rsvpStatus={rsvpStatus}
          onStatusChange={setRsvpStatus}
          rsvpNote={rsvpNote}
          onNoteChange={setRsvpNote}
          additionalGuestCount={additionalGuestCount}
          onAdditionalGuestCountChange={handleAdditionalGuestCountChange}
          additionalGuestDrafts={additionalGuestDrafts}
          onAdditionalGuestDraftChange={handleAdditionalGuestDraftChange}
          attendeeCategories={attendeeCategories}
          customQuestions={normalizedQuestions}
          customQuestionResponses={customQuestionResponses}
          onCustomQuestionResponseChange={(questionId, value) =>
            setCustomQuestionResponses((previous) => ({
              ...previous,
              [questionId]: value,
            }))}
          paymentBreakdown={paymentBreakdown}
          contributionPaymentInfo={settings.contributionPaymentInfo}
          collectionMode={settings.collectionMode ?? "offline"}
          settings={settings}
          canEditRsvp={canEditRsvp}
          isSaving={isSavingRsvp}
          onSave={handleSaveRsvp}
          errors={rsvpErrors}
          yesIsDisabled={yesIsDisabled}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          payerPhone={payerPhone}
          onPayerPhoneChange={setPayerPhone}
          hasPaid={hasPaid}
          pendingPayment={pendingPayment}
          guestToken={token}
          wantsToContribute={wantsToContribute}
          onToggleContribute={() => setWantsToContribute((prev) => !prev)}
          customOptionalAmount={isOptionalPayment ? customOptionalAmount : undefined}
          onCustomOptionalAmountChange={isOptionalPayment ? setCustomOptionalAmount : undefined}
          onPaymentSuccess={() => {
            setSavedStatus("yes");
            setPendingPayment(null);
            setHasPaid(true);
            toast.success("Payment confirmed! Your RSVP is confirmed.");
            router.refresh();
          }}
          onPaymentRetry={() => setPendingPayment(null)}
        />
      </div>
    </div>
  );
}
