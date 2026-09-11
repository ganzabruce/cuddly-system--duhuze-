"use server";

import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { ValidationError } from "@/lib/utils/errors";
import {
  createCheckoutPayment,
  updatePaymentProviderDetails,
  confirmPaymentSuccess,
  failPayment,
} from "@/lib/services/billing/checkout";
import type { CreateCheckoutPaymentInput } from "@/types/billing";
import { getPaymentByRequestTransactionId } from "@/lib/services/billing/reconciliation";
import {
  assertIntouchConfig,
  getTransactionStatus,
  requestConfiguredPayment,
} from "@/lib/services/billing/providers/intouch";
import { formatPhoneForDisplay, parseRwandanMobile } from "@/lib/utils/phone";
import {
  registerPesapalOrder,
  getPesapalTransactionStatus,
} from "@/lib/services/billing/providers/pesapal";
import { env } from "@/lib/env";
import { getAppBaseUrl } from "@/lib/utils/url";
import logger from "@/lib/utils/logger";
import type {
  BillingPeriod,
  CheckoutCurrency,
  CheckoutState,
  PaymentMethodType,
  PlanId,
} from "@/types/billing";

const VALID_PLANS = new Set<PlanId>(["standard", "premium"]);
const VALID_PERIODS = new Set<BillingPeriod>(["monthly", "yearly"]);
const VALID_CURRENCIES = new Set<CheckoutCurrency>(["RWF"]);
const VALID_PAYMENT_METHODS = new Set<PaymentMethodType>([
  "mtn_momo",
  "airtel_money",
  "card",
]);

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function buildRequestTransactionId(userId: number): string {
  const random = randomUUID().replace(/-/g, "").slice(0, 12);
  return `duhuze-${userId}-${Date.now()}-${random}`;
}

function buildIntouchCallbackUrl(baseUrl: string): string | undefined {
  try {
    return new URL("/api/billing/intouch/callback", baseUrl).toString();
  } catch (error) {
    logger.warn("Invalid Intouch callback URL base", error, {
      source: "checkout.create-payment",
    });
    return undefined;
  }
}

function assertIntouchConfigured() {
  assertIntouchConfig({
    baseUrl: env.INTOUCH_BASE_URL,
    username: env.INTOUCH_USERNAME,
    accountNo: env.INTOUCH_ACCOUNT_NO,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
  });
}

export async function createCheckoutPaymentAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to start checkout.",
    };
  }

  if (user.status === "suspended") {
    return {
      status: "error",
      message: "Suspended accounts cannot start a payment.",
    };
  }

  const planId = readString(formData, "planId") as PlanId | null;
  const billingPeriod = readString(formData, "billingPeriod") as BillingPeriod | null;
  const currency = readString(formData, "currency") as CheckoutCurrency | null;
  const paymentMethod = readString(formData, "paymentMethod") as PaymentMethodType | null;
  const payerPhone = readString(formData, "payerPhone");
  const payerName = readString(formData, "payerName") ?? user.name ?? null;

  if (!planId || !VALID_PLANS.has(planId)) {
    return { status: "error", message: "Select a valid paid plan." };
  }

  if (!billingPeriod || !VALID_PERIODS.has(billingPeriod)) {
    return { status: "error", message: "Select a valid billing period." };
  }

  if (!currency || !VALID_CURRENCIES.has(currency)) {
    return { status: "error", message: "Select a valid billing currency." };
  }

  if (!paymentMethod || !VALID_PAYMENT_METHODS.has(paymentMethod)) {
    return {
      status: "error",
      message: "Select a supported payment method.",
    };
  }

  if (paymentMethod === "card") {
    return handleCardPayment({
      user,
      planId,
      billingPeriod,
      currency,
      payerName,
      userEmail: user.email,
    });
  }

  if (!payerPhone) {
    return { status: "error", message: "Enter the phone number for payment." };
  }

  const normalizedPhone = parseRwandanMobile(payerPhone);
  if (!normalizedPhone) {
    return {
      status: "error",
      message: "Enter a valid Rwandan MTN MoMo or Airtel Money number.",
    };
  }

  try {
    assertIntouchConfigured();

    const checkoutInput: CreateCheckoutPaymentInput = {
      userId: user.id,
      planId,
      billingPeriod,
      currency,
      purpose: undefined,
      providerName: "intouch",
      requestTransactionId: buildRequestTransactionId(user.id),
      payerPhone: normalizedPhone,
      payerName,
    };

    const payment = await createCheckoutPayment(checkoutInput);

    try {
      const response = await requestConfiguredPayment({
        config: {
          baseUrl: env.INTOUCH_BASE_URL,
          username: env.INTOUCH_USERNAME,
          accountNo: env.INTOUCH_ACCOUNT_NO,
          partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
        },
        mobilePhone: normalizedPhone,
        amount: payment.amount,
        requestTransactionId: payment.requestTransactionId!,
        callbackUrl: buildIntouchCallbackUrl(getAppBaseUrl()),
      });

      if (response.state === "failed") {
        const failedPayment = await failPayment({
          paymentId: payment.id,
          providerStatusCode: response.responseCode,
          rawProviderStatus: response.raw,
        });

        return {
          status: "error",
          message: response.message || "Failed to initiate payment with provider.",
          payment: {
            id: failedPayment.id,
            requestTransactionId: failedPayment.requestTransactionId,
            amount: failedPayment.amount,
            currency: failedPayment.currency as CheckoutCurrency,
            planId: failedPayment.plan,
            billingPeriod: failedPayment.billingCycle,
            paymentMethod,
            payerPhone: formatPhoneForDisplay(failedPayment.payerPhone),
          },
        };
      }

      await updatePaymentProviderDetails(payment.id, {
        providerTransactionId: response.transactionId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
    } catch (error) {
      logger.error("Failed to initiate Intouch payment", error, {
        source: "checkout.create-payment",
        userId: user.id,
      });

      await failPayment({
        paymentId: payment.id,
        providerStatusCode: "REQUEST_INIT_FAILED",
        rawProviderStatus: {
          reason: "Failed to initiate payment with Intouch.",
          message: error instanceof Error ? error.message : "Unknown provider error",
        },
      });

      return {
        status: "error",
        message: "Failed to reach the payment provider. Try again.",
      };
    }

    return {
      status: "pending",
      message: "Payment request sent to your phone.",
      payment: {
        id: payment.id,
        requestTransactionId: payment.requestTransactionId,
        amount: payment.amount,
        currency: payment.currency as CheckoutCurrency,
        planId: payment.plan,
        billingPeriod: payment.billingCycle,
        paymentMethod,
        payerPhone: formatPhoneForDisplay(payment.payerPhone),
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create the payment request.",
    };
  }
}

async function handleCardPayment(input: {
  user: { id: number; name: string | null; email: string | null };
  planId: PlanId;
  billingPeriod: BillingPeriod;
  currency: CheckoutCurrency;
  payerName: string | null;
  userEmail: string | null;
}): Promise<CheckoutState> {
  if (!env.PESAPAL_BASE_URL || !env.PESAPAL_CONSUMER_KEY || !env.PESAPAL_CONSUMER_SECRET || !env.PESAPAL_NOTIFICATION_ID) {
    return { status: "error", message: "Card payments are not configured." };
  }
  if (!env.APP_BASE_URL) {
    return {
      status: "error",
      message: "Card payments require a configured public app URL.",
    };
  }

  const requestTransactionId = buildRequestTransactionId(input.user.id);
  const orderDescription = `${input.planId} (${input.billingPeriod}) subscription`;

  const checkoutInput: CreateCheckoutPaymentInput = {
    userId: input.user.id,
    planId: input.planId,
    billingPeriod: input.billingPeriod,
    currency: input.currency,
    purpose: undefined,
    providerName: "pesapal",
    requestTransactionId,
    payerPhone: null,
    payerName: input.payerName,
  };

  const payment = await createCheckoutPayment(checkoutInput);

  try {
    const callbackUrl = new URL(
      "/api/billing/pesapal/callback",
      getAppBaseUrl(),
    ).toString();

    const response = await registerPesapalOrder({
      baseUrl: env.PESAPAL_BASE_URL,
      consumerKey: env.PESAPAL_CONSUMER_KEY,
      consumerSecret: env.PESAPAL_CONSUMER_SECRET,
      notificationId: env.PESAPAL_NOTIFICATION_ID,
      merchantReference: requestTransactionId,
      description: orderDescription,
      amount: payment.amount,
      currency: input.currency,
      callbackUrl,
      billingAddress: {
        email_address: input.userEmail || undefined,
        first_name: input.payerName?.split(" ")[0] || undefined,
        last_name: input.payerName?.split(" ").slice(1).join(" ") || undefined,
      },
    });

    if (!response.success || !response.redirectUrl || !response.orderTrackingId) {
      await failPayment({
        paymentId: payment.id,
        providerStatusCode: "PESAPAL_REGISTER_FAILED",
        rawProviderStatus: { message: response.message, raw: response.raw },
      });

      return {
        status: "error",
        message: response.message || "Failed to initiate card payment.",
      };
    }

    await updatePaymentProviderDetails(payment.id, {
      providerTransactionId: response.orderTrackingId,
      providerStatusCode: "PESAPAL_PENDING",
      rawProviderStatus: response.raw,
    });

    return {
      status: "pending",
      message: "Redirecting to payment...",
      redirectUrl: response.redirectUrl,
      payment: {
        id: payment.id,
        requestTransactionId: payment.requestTransactionId,
        amount: payment.amount,
        currency: payment.currency as CheckoutCurrency,
        planId: payment.plan,
        billingPeriod: payment.billingCycle,
        paymentMethod: "card",
        payerPhone: null,
      },
    };
  } catch (error) {
    logger.error("Failed to register Pesapal order", error, {
      source: "checkout.card-payment",
      userId: input.user.id,
    });

    await failPayment({
      paymentId: payment.id,
      providerStatusCode: "PESAPAL_REQUEST_FAILED",
      rawProviderStatus: {
        reason: "Failed to register order with Pesapal.",
        message: error instanceof Error ? error.message : "Unknown provider error",
      },
    });

    return {
      status: "error",
      message: "Failed to reach the payment provider. Try again.",
    };
  }
}

export async function checkPaymentStatusAction(requestTransactionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Unauthorized." };
  }

  const payment = await getPaymentByRequestTransactionId(requestTransactionId);
  if (!payment) {
    return { status: "error", message: "Payment not found." };
  }

  if (payment.userId !== user.id) {
    return { status: "error", message: "Unauthorized." };
  }

  if (payment.status !== "pending") {
    return { status: payment.status, payment };
  }

  if (payment.providerName === "pesapal" && env.PESAPAL_BASE_URL && env.PESAPAL_CONSUMER_KEY && env.PESAPAL_CONSUMER_SECRET) {
    try {
      const orderTrackingId = payment.providerTransactionId;
      if (!orderTrackingId) {
        return { status: "pending", payment };
      }

      const response = await getPesapalTransactionStatus({
        baseUrl: env.PESAPAL_BASE_URL,
        consumerKey: env.PESAPAL_CONSUMER_KEY,
        consumerSecret: env.PESAPAL_CONSUMER_SECRET,
        orderTrackingId,
      });

      if (response.state === "succeeded") {
        const result = await confirmPaymentSuccess({
          paymentId: payment.id,
          providerTransactionId: response.orderTrackingId ?? orderTrackingId,
          providerReferenceNo: response.confirmationCode,
          providerStatusCode:
            response.paymentStatusCode ?? response.paymentStatusDescription,
          rawProviderStatus: response.raw,
        });
        return { status: "succeeded", payment: result.payment };
      }

      if (response.state === "failed") {
        const result = await failPayment({
          paymentId: payment.id,
          providerStatusCode:
            response.paymentStatusCode ?? response.paymentStatusDescription,
          rawProviderStatus: response.raw,
        });
        return { status: "failed", payment: result };
      }

      await updatePaymentProviderDetails(payment.id, {
        providerTransactionId: response.orderTrackingId ?? orderTrackingId,
        providerReferenceNo: response.confirmationCode,
        providerStatusCode:
          response.paymentStatusCode ?? response.paymentStatusDescription,
        rawProviderStatus: response.raw,
      });

      return { status: "pending", payment };
    } catch (error) {
      logger.error("Pesapal status check failed", error);
      return { status: "pending", payment };
    }
  }

  if (env.INTOUCH_BASE_URL && env.INTOUCH_USERNAME && env.INTOUCH_ACCOUNT_NO && env.INTOUCH_PARTNER_PASSWORD) {
    try {
      const response = await getTransactionStatus({
        baseUrl: env.INTOUCH_BASE_URL,
        username: env.INTOUCH_USERNAME,
        accountNo: env.INTOUCH_ACCOUNT_NO,
        partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
        requestTransactionId,
        transactionId: payment.providerTransactionId ?? requestTransactionId,
      });

      if (response.state === "succeeded") {
        const result = await confirmPaymentSuccess({
          paymentId: payment.id,
          providerTransactionId: response.transactionId,
          providerStatusCode: response.responseCode,
          rawProviderStatus: response.raw,
        });
        return { status: "succeeded", payment: result.payment };
      }

      if (response.state === "failed") {
        const result = await failPayment({
          paymentId: payment.id,
          providerStatusCode: response.responseCode,
          rawProviderStatus: response.raw,
        });
        return { status: "failed", payment: result };
      }

      await updatePaymentProviderDetails(payment.id, {
        providerTransactionId: response.transactionId,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
      return { status: "pending", payment };
    } catch (error) {
      logger.error("Status check failed", error);
      return { status: "pending", payment };
    }
  }

  return { status: "pending", payment };
}
