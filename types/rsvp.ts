import type { EventPaymentMethod } from "@/types/events";

export type RsvpStatus = "yes" | "no" | "maybe";

export interface FormState {
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
    paymentMethod: EventPaymentMethod;
    payerPhone?: string | null;
  };
}

export type PaymentActionPayload = NonNullable<FormState["payment"]>;

export type AdditionalGuestDetail = {
  name: string | null;
  email: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  sortOrder: number;
};

export type RsvpRouteParams = {
  eventId: number;
  username: string;
  eventSlug: string;
};

export type UpdateRsvpByTokenInput = {
  rsvpStatus: RsvpStatus;
  rsvpNote?: string | null;
  additionalGuestCount?: number;
  customQuestionResponses?: Record<string, string>;
  additionalGuests?: Array<{
    name?: string | null;
    email?: string | null;
    categoryId?: string | null;
  }>;
  paymentMethod?: "mtn_momo" | "airtel_money";
  payerPhone?: string | null;
  paymentIntent?: "none" | "start";
  optionalContributionAmount?: number | null;
};

export type UpdateRsvpByTokenErrors = {
  rsvpStatus?: string;
  rsvpNote?: string;
  additionalGuestCount?: string;
  customQuestions?: string;
};

export type UpdateRsvpByTokenResult =
  | {
      success: true;
      message: string;
      guestToken: string;
      paymentPending?: boolean;
      payment?: {
        id: number;
        requestTransactionId: string;
        amount: number;
        currency: string;
        status: string;
        paymentMethod: EventPaymentMethod;
        payerPhone?: string | null;
      };
      redirectUrl?: string | null;
    }
  | {
      success: false;
      message: string;
      errors?: UpdateRsvpByTokenErrors;
    };
