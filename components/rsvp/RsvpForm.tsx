"use client";

import { useActionState, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { submitPublicRsvp } from "@/actions/rsvp/submit-public-rsvp";
import type { PaymentMethodType } from "@/types/billing";
import { formatCurrency as formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  getPrimaryAttendeeCategory,
  normalizeAttendeeCategories,
  normalizeCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import type {
  AdditionalGuestDraft,
  AttendeeCategory,
  CustomRsvpQuestion,
  PaymentBreakdownLine,
} from "@/types/events";
import { Button } from "@/components/ui/button";
import { BaseFields } from "./steps/BaseFields";
import type { BaseFieldsHandle } from "./steps/BaseFields";
import { StepIndicator } from "./StepIndicator";
import { QuestionsStep } from "./steps/QuestionsStep";
import type { QuestionsStepHandle } from "./steps/QuestionsStep";
import { PaymentStep } from "./steps/PaymentStep";
import type { PaymentStepHandle } from "./steps/PaymentStep";
import { PaymentStatusScreen } from "./PaymentStatusScreen";

interface FormState {
  success?: boolean;
  message?: string;
  redirectUrl?: string | null;
  guestToken?: string;
  errors?: {
    name?: string;
    email?: string;
    rsvpStatus?: string;
    rsvpNote?: string;
    additionalGuestCount?: string;
    customQuestions?: string;
    payerPhone?: string;
  };
  paymentPending?: boolean;
  payment?: {
    id: number;
    requestTransactionId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: "mobile_money";
    payerPhone?: string | null;
  };
}

export interface RsvpFormProps {
  eventId: number;
  username: string;
  eventSlug: string;
  atCapacity?: boolean;
  paymentsEnabled?: boolean;
  collectionMode?: "offline" | "platform" | "optional";
  contributionAmount?: number | null;
  contributionPaymentInfo?: string | null;
  currency?: string | null;
  customQuestions?: CustomRsvpQuestion[];
  attendeeCategories?: AttendeeCategory[];
  allowAdditionalGuests?: boolean;
  maxAdditionalGuests?: number;
  inviteToken?: string;
  onSuccess?: (payload: { message?: string; guestToken?: string }) => void;
  onFooterChange?: (content: ReactNode) => void;
}

function friendlyErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("payment") && lower.includes("initiat")) {
    return "Payment could not be started";
  }
  if (lower.includes("already rsvp") || lower.includes("already submitted")) {
    return "You've already submitted an RSVP";
  }
  if (lower.includes("capacity") || lower.includes("full")) {
    return "This event is now at capacity";
  }
  return raw;
}

function paymentErrorDescription(raw: string): string | undefined {
  const lower = raw.toLowerCase();
  if (lower.includes("payment") && lower.includes("initiat")) {
    return "Check that your phone number is correct and try again. If the problem persists, try a different payment method.";
  }
  return undefined;
}

type StepConfig = {
  id: string;
  label: string;
};

export function RsvpForm({
  eventId,
  username,
  eventSlug,
  atCapacity = false,
  paymentsEnabled = false,
  collectionMode = "offline",
  contributionAmount,
  contributionPaymentInfo,
  currency = "RWF",
  customQuestions = [],
  attendeeCategories = [],
  allowAdditionalGuests = false,
  maxAdditionalGuests = 0,
  inviteToken,
  onSuccess,
  onFooterChange,
}: RsvpFormProps) {
  const initialState: FormState = {};
  const normalizedQuestions = useMemo(
    () => normalizeCustomQuestions(customQuestions),
    [customQuestions],
  );
  const normalizedCategories = useMemo(
    () => normalizeAttendeeCategories(attendeeCategories),
    [attendeeCategories],
  );
  const primaryCategory = useMemo(
    () => getPrimaryAttendeeCategory(normalizedCategories),
    [normalizedCategories],
  );

  const isOptionalPayment = collectionMode === "optional" && paymentsEnabled;

  // ─── Form state ──────────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [additionalGuestCount, setAdditionalGuestCount] = useState(0);
  const [additionalGuestDrafts, setAdditionalGuestDrafts] = useState<AdditionalGuestDraft[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("mtn_momo");
  const [payerPhone, setPayerPhone] = useState("");
  const [customOptionalAmount, setCustomOptionalAmount] = useState<number | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const baseFieldsRef = useRef<BaseFieldsHandle>(null);
  const questionsStepRef = useRef<QuestionsStepHandle>(null);
  const paymentStepRef = useRef<PaymentStepHandle>(null);

  const [state, formAction, isPending] = useActionState(submitPublicRsvp, initialState);

  // ─── Reactive step composition ───────────────────────────────
  const showAdditionalGuests = allowAdditionalGuests && selectedStatus === "yes" && !atCapacity;
  const effectiveAdditionalGuestCount = showAdditionalGuests ? additionalGuestCount : 0;
  const hasQuestions = normalizedQuestions.length > 0;
  const shouldShowQuestions = hasQuestions && !!selectedStatus && selectedStatus !== "no";
  const hasPayments = paymentsEnabled && selectedStatus === "yes";

  const activeSteps = useMemo<StepConfig[]>(() => {
    const steps: StepConfig[] = [];
    if (shouldShowQuestions) steps.push({ id: "questions", label: "Questions" });
    if (hasPayments) steps.push({ id: "payment", label: "Payment" });
    return steps;
  }, [shouldShowQuestions, hasPayments]);

  const hasSteps = activeSteps.length > 0;
  const isOnBase = currentStep === 0;
  const activeStepIndex = currentStep - 1;
  const activeStepId = activeStepIndex >= 0 && activeStepIndex < activeSteps.length
    ? activeSteps[activeStepIndex]?.id ?? null
    : null;

  const indicatorSteps = useMemo(() => {
    if (!hasSteps) return [];
    return [
      { id: 1, label: "Your info" },
      ...activeSteps.map((s, i) => ({ id: i + 2, label: s.label })),
    ];
  }, [hasSteps, activeSteps]);

  const indicatorCurrentStep = currentStep + 1;

  // ─── Payment breakdown ───────────────────────────────────────
  const formatCurrency = (amount: number) => formatMoney(amount, currency || "RWF");

  const paymentBreakdown = useMemo<PaymentBreakdownLine[]>(() => {
    if (selectedStatus !== "yes") return [];

    if (normalizedCategories.length > 0) {
      const counts = new Map<string, number>();
      if (primaryCategory) counts.set(primaryCategory.id, 1);
      additionalGuestDrafts
        .slice(0, effectiveAdditionalGuestCount)
        .forEach((draft) => {
          if (!draft.categoryId) return;
          counts.set(draft.categoryId, (counts.get(draft.categoryId) ?? 0) + 1);
        });
      return normalizedCategories
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

    const attendeeCount = 1 + effectiveAdditionalGuestCount;

    if (isOptionalPayment) {
      const totalAmount = customOptionalAmount ?? 0;
      return totalAmount > 0
        ? [{ label: "Guests", count: 1, contributionAmount: totalAmount, subtotalAmount: totalAmount }]
        : [];
    }

    const amountPerPerson = contributionAmount ?? 0;
    return amountPerPerson > 0
      ? [{ label: "Guests", count: attendeeCount, contributionAmount: amountPerPerson, subtotalAmount: amountPerPerson * attendeeCount }]
      : [];
  }, [additionalGuestDrafts, contributionAmount, customOptionalAmount, effectiveAdditionalGuestCount, isOptionalPayment, normalizedCategories, primaryCategory, selectedStatus]);

  const totalContribution = paymentBreakdown.reduce((sum, line) => sum + line.subtotalAmount, 0);

  // ─── Side effects ────────────────────────────────────────────
  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess({
        message: state.message ?? "Thank you for your response. We look forward to seeing you!",
        guestToken: state.guestToken,
      });
    }
  }, [onSuccess, state.guestToken, state.message, state.success]);

  useEffect(() => {
    if (!state.message || state.success || state.paymentPending) return;
    toast.error(friendlyErrorMessage(state.message), {
      description: paymentErrorDescription(state.message),
      duration: 6000,
    });
  }, [state.message, state.success, state.paymentPending]);

  useEffect(() => {
    if (state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state.redirectUrl]);

  // ─── Navigation ──────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isOnBase) {
      if (!baseFieldsRef.current?.validate()) return;
      setCurrentStep(1);
      return;
    }
    const step = activeSteps[activeStepIndex];
    if (step?.id === "questions" && !questionsStepRef.current?.validate()) return;
    if (step?.id === "payment" && !paymentStepRef.current?.validate()) return;
    if (activeStepIndex < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [isOnBase, activeSteps, activeStepIndex, currentStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(Math.max(0, currentStep - 1));
  }, [currentStep]);

  // ─── Event handlers ──────────────────────────────────────────
  const handleAdditionalGuestCountChange = (count: number) => {
    const safeCount = Math.max(0, Math.min(maxAdditionalGuests, count));
    setAdditionalGuestCount(safeCount);
    setAdditionalGuestDrafts((current) =>
      Array.from({ length: safeCount }, (_, index) => ({
        name: current[index]?.name ?? "",
        email: current[index]?.email ?? "",
        categoryId: current[index]?.categoryId ?? normalizedCategories[0]?.id ?? "",
      })),
    );
  };

  const handleAdditionalGuestDraftChange = (
    index: number,
    field: keyof AdditionalGuestDraft,
    value: string,
  ) => {
    setAdditionalGuestDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, [field]: value } : draft)),
    );
  };

  const handleStatusChange = (value: string) => {
    if (value === "no") {
      setCurrentStep(0);
    }
    setSelectedStatus(value);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (shouldShowQuestions && questionsStepRef.current) {
      if (!questionsStepRef.current.validate()) {
        event.preventDefault();
        return;
      }
    }
    if (hasPayments && paymentStepRef.current) {
      if (!paymentStepRef.current.validate()) {
        event.preventDefault();
      }
    }
  };

  // ─── Footer ──────────────────────────────────────────────────
  const submitLabel = isPending ? "Submitting..." : "Submit RSVP";
  const isLastStep = hasSteps && activeStepIndex === activeSteps.length - 1;
  const nextStepLabel = hasSteps && activeStepIndex < activeSteps.length - 1
    ? activeSteps[activeStepIndex + 1]?.label
    : null;

  const footer = useMemo<ReactNode>(() => {
    if (state.paymentPending && state.guestToken) {
      const token = state.guestToken;
      return (
        <>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Back
          </Button>
          <Button
            onClick={() =>
              onSuccess?.({
                message: "Your RSVP has been submitted. Payment is still being processed.",
                guestToken: token,
              })
            }
          >
            Submit RSVP
          </Button>
        </>
      );
    }

    if (!hasSteps) {
      return (
        <Button type="submit" form="rsvp-form" disabled={isPending}>
          {submitLabel}
        </Button>
      );
    }

    if (isOnBase) {
      return (
        <Button type="button" onClick={handleNext}>
          Continue to {activeSteps[0]?.label}
        </Button>
      );
    }

    if (isLastStep) {
      return (
        <>
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button type="submit" form="rsvp-form" disabled={isPending}>
            {submitLabel}
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext}>
          Continue to {nextStepLabel}
        </Button>
      </>
    );
  }, [
    state.paymentPending, state.guestToken, onSuccess,
    hasSteps, isOnBase, isLastStep, isPending, submitLabel,
    activeSteps, nextStepLabel, handleNext, handleBack,
  ]);

  useLayoutEffect(() => {
    onFooterChange?.(footer);
  }, [footer, onFooterChange]);

  // ─── Payment pending screen ──────────────────────────────────
  if (state.paymentPending && state.payment && state.guestToken) {
    return (
      <PaymentStatusScreen
        guestToken={state.guestToken}
        requestTransactionId={state.payment.requestTransactionId}
        amount={state.payment.amount}
        currency={state.payment.currency}
        payerPhone={state.payment.payerPhone}
        onRetry={() => window.location.reload()}
        onSuccess={() =>
          onSuccess?.({
            message: "Payment confirmed! Your RSVP is confirmed.",
            guestToken: state.guestToken,
          })
        }
      />
    );
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div>
      {hasSteps ? (
        <StepIndicator steps={indicatorSteps} currentStep={indicatorCurrentStep} />
      ) : null}

      <form
        id="rsvp-form"
        ref={formRef}
        action={formAction}
        onSubmit={handleFormSubmit}
        className="space-y-6"
      >
        {/* Hidden metadata */}
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="username" value={username} />
        <input type="hidden" name="eventSlug" value={eventSlug} />
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        {selectedStatus ? <input type="hidden" name="rsvpStatus" value={selectedStatus} /> : null}
        {hasPayments && !(isOptionalPayment && !customOptionalAmount) ? (
          <input type="hidden" name="startPayment" value="true" />
        ) : null}
        {isOptionalPayment && !customOptionalAmount ? (
          <input type="hidden" name="skipContribution" value="true" />
        ) : null}

        {/* Base fields */}
        <div
          className={cn("space-y-6", !isOnBase && "hidden")}
          aria-hidden={!isOnBase}
          inert={!isOnBase ? true : undefined}
        >
          {hasSteps ? (
            <h3 className="text-center font-display text-lg font-semibold text-foreground sm:text-xl">
              Your info &amp; response
            </h3>
          ) : null}
          <BaseFields
            ref={baseFieldsRef}
            nameValue={nameValue}
            emailValue={emailValue}
            phoneValue={phoneValue}
            onNameChange={setNameValue}
            onEmailChange={setEmailValue}
            onPhoneChange={setPhoneValue}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            additionalGuestCount={additionalGuestCount}
            onAdditionalGuestCountChange={handleAdditionalGuestCountChange}
            additionalGuestDrafts={additionalGuestDrafts}
            onAdditionalGuestDraftChange={handleAdditionalGuestDraftChange}
            attendeeCategories={normalizedCategories}
            allowAdditionalGuests={allowAdditionalGuests}
            maxAdditionalGuests={maxAdditionalGuests}
            rsvpNote=""
            errors={state.errors}
            atCapacity={atCapacity}
          />
        </div>

        {/* Questions step */}
        {shouldShowQuestions ? (
          <div
            className={cn("space-y-6", activeStepId !== "questions" && "hidden")}
            aria-hidden={activeStepId !== "questions"}
            inert={activeStepId !== "questions" ? true : undefined}
          >
            <h3 className="text-center font-display text-lg font-semibold text-foreground sm:text-xl">
              A few more questions
            </h3>
            <QuestionsStep
              ref={questionsStepRef}
              customQuestions={normalizedQuestions}
              serverErrors={state.errors}
            />
          </div>
        ) : null}

        {/* Payment step */}
        {hasPayments ? (
          <div
            className={cn("space-y-6", activeStepId !== "payment" && "hidden")}
            aria-hidden={activeStepId !== "payment"}
            inert={activeStepId !== "payment" ? true : undefined}
          >
            <h3 className="text-center font-display text-lg font-semibold text-foreground sm:text-xl">
              Review &amp; confirm
            </h3>
            <PaymentStep
              ref={paymentStepRef}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              payerPhone={payerPhone}
              onPayerPhoneChange={setPayerPhone}
              contributionPaymentInfo={contributionPaymentInfo}
              isOptionalPayment={isOptionalPayment}
              optionalAmount={customOptionalAmount}
              onOptionalAmountChange={setCustomOptionalAmount}
              suggestedAmount={contributionAmount}
              paymentBreakdown={paymentBreakdown}
              totalContribution={totalContribution}
              formatCurrency={formatCurrency}
              nameValue={nameValue}
              selectedStatus={selectedStatus}
              additionalGuestCount={additionalGuestCount}
              serverErrors={state.errors}
            />
          </div>
        ) : null}

      </form>
    </div>
  );
}
