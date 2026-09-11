"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { PaymentMethodType } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptionalContributionAmountInput } from "./OptionalContributionAmountInput";
import { PaymentDetails } from "@/components/rsvp/PaymentDetails";
import { PaymentStatusScreen } from "@/components/rsvp/PaymentStatusScreen";
import {
  MAX_TEXTAREA_ANSWER_LENGTH,
} from "@/lib/constants/events/rsvp-limits";
import type {
  AdditionalGuestDraft,
  AttendeeCategory,
  CustomRsvpQuestion,
  PaymentBreakdownLine,
} from "@/types/events";

type CapacityInfo = {
  guestCapacity: number | null;
  allowAdditionalGuests: boolean;
  maxAdditionalGuests: number;
  totalSeatsUsed: number;
  atCapacity: boolean;
};

interface PaymentInfo {
  id: number;
  requestTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: "mobile_money";
  payerPhone?: string | null;
}

interface RsvpUpdateCardProps {
  rsvpStatus: "yes" | "no" | "maybe";
  onStatusChange: (status: "yes" | "no" | "maybe") => void;
  rsvpNote: string;
  onNoteChange: (value: string) => void;
  additionalGuestCount: number;
  onAdditionalGuestCountChange: (count: number) => void;
  additionalGuestDrafts: AdditionalGuestDraft[];
  onAdditionalGuestDraftChange: (
    index: number,
    field: keyof AdditionalGuestDraft,
    value: string,
  ) => void;
  attendeeCategories: AttendeeCategory[];
  customQuestions: CustomRsvpQuestion[];
  customQuestionResponses: Record<string, string>;
  onCustomQuestionResponseChange: (questionId: string, value: string) => void;
  paymentBreakdown: PaymentBreakdownLine[];
  contributionPaymentInfo?: string | null;
  collectionMode?: "offline" | "platform" | "optional";
  settings: CapacityInfo;
  canEditRsvp: boolean;
  isSaving: boolean;
  onSave: () => void;
  errors: {
    rsvpStatus?: string;
    rsvpNote?: string;
    additionalGuestCount?: string;
    customQuestions?: string;
  };
  yesIsDisabled: boolean;
  paymentMethod?: PaymentMethodType;
  onPaymentMethodChange?: (value: PaymentMethodType) => void;
  // Payment state (for platform mode)
  payerPhone?: string;
  onPayerPhoneChange?: (value: string) => void;
  hasPaid?: boolean;
  pendingPayment?: PaymentInfo | null;
  guestToken?: string;
  onPaymentSuccess?: () => void;
  onPaymentRetry?: () => void;
  wantsToContribute?: boolean;
  onToggleContribute?: () => void;
  customOptionalAmount?: number | undefined;
  onCustomOptionalAmountChange?: (value: number | undefined) => void;
}

function MultiselectEditor({
  question,
  value,
  onChange,
}: {
  question: CustomRsvpQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });

  return (
    <div className="space-y-2">
      {(question.options ?? []).map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={`${question.id}-${option}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...selected, option]
                  : selected.filter((item) => item !== option);
                setSelected(next);
                onChange(JSON.stringify(next));
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

export function RsvpUpdateCard({
  rsvpStatus,
  onStatusChange,
  rsvpNote,
  onNoteChange,
  additionalGuestCount,
  onAdditionalGuestCountChange,
  additionalGuestDrafts,
  onAdditionalGuestDraftChange,
  attendeeCategories,
  customQuestions,
  customQuestionResponses,
  onCustomQuestionResponseChange,
  paymentBreakdown,
  contributionPaymentInfo,
  collectionMode = "offline",
  settings,
  canEditRsvp,
  isSaving,
  onSave,
  errors,
  yesIsDisabled,
  paymentMethod,
  onPaymentMethodChange,
  payerPhone,
  onPayerPhoneChange,
  hasPaid = false,
  pendingPayment,
  guestToken,
  onPaymentSuccess,
  onPaymentRetry,
  wantsToContribute = true,
  onToggleContribute,
  customOptionalAmount,
  onCustomOptionalAmountChange,
}: RsvpUpdateCardProps) {
  const isPlatformPayment = collectionMode === "platform";
  const isOptionalPayment = collectionMode === "optional";
  const additionalGuestsVisible =
    settings.allowAdditionalGuests && rsvpStatus === "yes" && canEditRsvp;
  const customQuestionsVisible =
    customQuestions.length > 0 && rsvpStatus !== "no";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Update your response
          </h2>
          {!canEditRsvp ? (
            <span className="rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning-foreground">
              RSVP locked
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <div className="space-y-2">
          <Label>Response</Label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(["yes", "no", "maybe"] as const).map((status) => (
              <label
                key={status}
                className={
                  status === "yes" && yesIsDisabled
                    ? "relative flex cursor-not-allowed opacity-60"
                    : canEditRsvp
                      ? "relative flex cursor-pointer"
                      : "relative flex cursor-not-allowed opacity-60"
                }
              >
                <input
                  type="radio"
                  name="rsvpStatus"
                  value={status}
                  className="peer sr-only"
                  disabled={(status === "yes" && yesIsDisabled) || !canEditRsvp}
                  checked={rsvpStatus === status}
                  onChange={() => onStatusChange(status)}
                />
                <div className="flex h-11 w-full items-center justify-center rounded-md border-2 border-input bg-background text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-accent peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                  {status === "maybe" ? "Maybe" : status === "yes" ? "Yes" : "No"}
                </div>
              </label>
            ))}
          </div>

          {settings.guestCapacity != null ? (
            <p className="text-xs text-muted-foreground">
              Capacity: {settings.totalSeatsUsed} / {settings.guestCapacity} seats used
            </p>
          ) : null}
          {yesIsDisabled ? (
            <p className="text-xs text-warning-foreground">
              This event is full. You can still choose No or Maybe.
            </p>
          ) : null}
          {errors.rsvpStatus ? (
            <p className="text-sm text-destructive">{errors.rsvpStatus}</p>
          ) : null}
        </div>

        {additionalGuestsVisible ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="additionalGuestCount">Additional guests</Label>
              <Input
                id="additionalGuestCount"
                type="number"
                min={0}
                max={settings.maxAdditionalGuests}
                value={additionalGuestCount}
                disabled={!canEditRsvp}
                onChange={(event) => {
                  const count = Number(event.currentTarget.value) || 0;
                  onAdditionalGuestCountChange(
                    Math.max(0, Math.min(settings.maxAdditionalGuests, count)),
                  );
                }}
              />
              {errors.additionalGuestCount ? (
                <p className="text-sm text-destructive">
                  {errors.additionalGuestCount}
                </p>
              ) : null}
            </div>

            {additionalGuestCount > 0 ? (
              <div className="space-y-3">
                {Array.from({ length: additionalGuestCount }, (_, index) => (
                  <div
                    key={`additional-guest-${index}`}
                    className="rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      Additional guest {index + 1}
                    </p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Full name"
                        value={additionalGuestDrafts[index]?.name ?? ""}
                        onChange={(event) =>
                          onAdditionalGuestDraftChange(
                            index,
                            "name",
                            event.currentTarget.value,
                          )}
                        disabled={!canEditRsvp}
                      />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={additionalGuestDrafts[index]?.email ?? ""}
                        onChange={(event) =>
                          onAdditionalGuestDraftChange(
                            index,
                            "email",
                            event.currentTarget.value,
                          )}
                        disabled={!canEditRsvp}
                      />
                      {attendeeCategories.length > 0 ? (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground sm:col-span-2"
                          value={additionalGuestDrafts[index]?.categoryId ?? ""}
                          onChange={(event) =>
                            onAdditionalGuestDraftChange(
                              index,
                              "categoryId",
                              event.currentTarget.value,
                            )}
                          disabled={!canEditRsvp}
                        >
                          {attendeeCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {customQuestionsVisible ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Additional questions
              </h3>
              {errors.customQuestions ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customQuestions}
                </p>
              ) : null}
            </div>

            {customQuestions.map((question) => {
              const type = question.type ?? "text";
              const value = customQuestionResponses[question.id] ?? "";

              return (
                <div key={question.id} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {question.label}
                    {question.required ? (
                      <span className="ml-1 text-destructive">*</span>
                    ) : null}
                  </Label>

                  {type === "textarea" ? (
                    <Textarea
                      rows={4}
                      maxLength={MAX_TEXTAREA_ANSWER_LENGTH}
                      value={value}
                      onChange={(event) =>
                        onCustomQuestionResponseChange(
                          question.id,
                          event.currentTarget.value,
                        )}
                      disabled={!canEditRsvp}
                    />
                  ) : null}

                  {type === "yesno" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {(["yes", "no"] as const).map((answer) => (
                        <label key={`${question.id}-${answer}`} className="relative flex cursor-pointer">
                          <input
                            type="radio"
                            className="peer sr-only"
                            checked={value === answer}
                            onChange={() =>
                              onCustomQuestionResponseChange(question.id, answer)}
                            disabled={!canEditRsvp}
                          />
                          <div className="flex h-11 w-full items-center justify-center rounded-md border-2 border-input bg-background text-sm font-medium text-foreground transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                            {answer === "yes" ? "Yes" : "No"}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {type === "select" ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      value={value}
                      onChange={(event) =>
                        onCustomQuestionResponseChange(
                          question.id,
                          event.currentTarget.value,
                        )}
                      disabled={!canEditRsvp}
                    >
                      <option value="">Select an option</option>
                      {(question.options ?? []).map((option) => (
                        <option key={`${question.id}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {type === "multiselect" ? (
                    <MultiselectEditor
                      question={question}
                      value={value}
                      onChange={(nextValue) =>
                        onCustomQuestionResponseChange(question.id, nextValue)}
                    />
                  ) : null}

                  {type === "text" ? (
                    <Input
                      maxLength={1000}
                      value={value}
                      onChange={(event) =>
                        onCustomQuestionResponseChange(
                          question.id,
                          event.currentTarget.value,
                        )}
                      disabled={!canEditRsvp}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="rsvpNote">Notes</Label>
          <Textarea
            id="rsvpNote"
            value={rsvpNote}
            onChange={(event) => onNoteChange(event.currentTarget.value)}
            rows={3}
            disabled={!canEditRsvp}
            placeholder="Any details for the organizer"
          />
          {errors.rsvpNote ? (
            <p className="text-sm text-destructive">{errors.rsvpNote}</p>
          ) : null}
        </div>

        {pendingPayment && guestToken ? (
          <PaymentStatusScreen
            guestToken={guestToken}
            requestTransactionId={pendingPayment.requestTransactionId}
            amount={pendingPayment.amount}
            currency={pendingPayment.currency}
            payerPhone={pendingPayment.payerPhone}
            onRetry={onPaymentRetry ?? (() => {})}
            onSuccess={onPaymentSuccess}
          />
        ) : (
          <>
            {hasPaid && (
              <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success-surface px-3 py-2">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-success-deep" />
                <p className="text-sm text-success-deep">Contribution received.</p>
              </div>
            )}
            {!hasPaid && isOptionalPayment && onCustomOptionalAmountChange && rsvpStatus === "yes" ? (
              <OptionalContributionAmountInput
                value={customOptionalAmount}
                onChange={onCustomOptionalAmountChange}
                disabled={!canEditRsvp}
              />
            ) : null}

            {!hasPaid && paymentBreakdown.length > 0 ? (
              isOptionalPayment && !wantsToContribute ? (
                <div className="rounded-md border border-border bg-muted/40 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Contribution skipped.</p>
                  {canEditRsvp && onToggleContribute ? (
                    <button
                      type="button"
                      onClick={onToggleContribute}
                      className="mt-2 text-sm text-primary underline underline-offset-2"
                    >
                      Add contribution
                    </button>
                  ) : null}
                </div>
              ) : (
                <PaymentDetails
                  contributionPaymentInfo={contributionPaymentInfo}
                  paymentMethod={isPlatformPayment || isOptionalPayment ? paymentMethod : undefined}
                  onPaymentMethodChange={
                    (isPlatformPayment || isOptionalPayment) && canEditRsvp
                      ? onPaymentMethodChange
                      : undefined
                  }
                  payerPhone={
                    (isPlatformPayment || isOptionalPayment) &&
                    rsvpStatus === "yes"
                      ? payerPhone
                      : undefined
                  }
                  onPayerPhoneChange={
                    (isPlatformPayment || isOptionalPayment) &&
                    rsvpStatus === "yes"
                      ? onPayerPhoneChange
                      : undefined
                  }
                  disabled={!canEditRsvp}
                />
              )
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                className="w-full sm:w-auto"
                onClick={onSave}
                disabled={!canEditRsvp || isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : !hasPaid && (isPlatformPayment || (isOptionalPayment && wantsToContribute && (customOptionalAmount ?? 0) > 0)) && rsvpStatus === "yes"
                    ? "Continue to payment"
                    : "Save changes"}
              </Button>
              {isOptionalPayment && canEditRsvp && onToggleContribute && wantsToContribute && !hasPaid && (customOptionalAmount ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={onToggleContribute}
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Skip contribution
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
