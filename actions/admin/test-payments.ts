"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/actions/admin/auth";
import {
  createTestPayment,
  updatePaymentProviderDetails,
  failPayment,
  confirmPaymentSuccess,
} from "@/lib/services/billing/checkout";
import { getPaymentById } from "@/lib/services/billing/reconciliation";
import {
  assertIntouchConfig,
  getTransactionStatus,
  requestConfiguredPayment,
} from "@/lib/services/billing/providers/intouch";
import {
  registerPesapalOrder,
  getPesapalTransactionStatus,
} from "@/lib/services/billing/providers/pesapal";
import { parseRwandanMobile } from "@/lib/utils/phone";
import { env } from "@/lib/env";
import { getAppBaseUrl } from "@/lib/utils/url";
import logger from "@/lib/utils/logger";
import type { TestPaymentResult, CheckResult } from "@/types/admin";
import type { ActionResult } from "@/types/result";

type TestGateway = "intouch" | "pesapal";


function buildRequestTransactionId(adminUserId: number): string {
  const random = randomUUID().replace(/-/g, "").slice(0, 12);
  return `test-${adminUserId}-${Date.now()}-${random}`;
}

export async function adminTestPaymentAction(input: {
  amount: number;
  gateway: TestGateway;
  payerPhone: string;
  payerName: string;
}): Promise<ActionResult<TestPaymentResult>> {
  try {
    const data = await runTestPayment(input);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Payment request failed.",
    };
  }
}

async function runTestPayment(input: {
  amount: number;
  gateway: TestGateway;
  payerPhone: string;
  payerName: string;
}): Promise<TestPaymentResult> {
  const admin = await requireAdmin();
  const isPesapal = input.gateway === "pesapal";
  const requestTransactionId = buildRequestTransactionId(admin.userId);

  const normalizedPhone = isPesapal
    ? null
    : parseRwandanMobile(input.payerPhone);
  if (!isPesapal && !normalizedPhone) {
    throw new Error("Enter a valid Rwandan mobile number.");
  }

  const payment = await createTestPayment({
    userId: admin.userId,
    amount: input.amount,
    currency: "RWF",
    providerName: input.gateway,
    requestTransactionId,
    payerPhone: normalizedPhone,
    payerName: input.payerName,
  });

  let alreadyFailed = false;

  try {
    if (isPesapal) {
      if (
        !env.PESAPAL_BASE_URL ||
        !env.PESAPAL_CONSUMER_KEY ||
        !env.PESAPAL_CONSUMER_SECRET ||
        !env.PESAPAL_NOTIFICATION_ID
      ) {
        throw new Error("Pesapal is not configured.");
      }

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
        description: `Admin test payment — ${input.amount} RWF`,
        amount: payment.amount,
        currency: "RWF",
        callbackUrl,
        billingAddress: {
          email_address: admin.email,
          first_name: input.payerName.split(" ")[0] || undefined,
          last_name: input.payerName.split(" ").slice(1).join(" ") || undefined,
        },
      });

      if (
        !response.success ||
        !response.redirectUrl ||
        !response.orderTrackingId
      ) {
        alreadyFailed = true;
        await failPayment({
          paymentId: payment.id,
          providerStatusCode: "PESAPAL_REGISTER_FAILED",
          rawProviderStatus: { message: response.message, raw: response.raw },
        });
        throw new Error(
          response.message || "Failed to initiate card payment.",
        );
      }

      await updatePaymentProviderDetails(payment.id, {
        providerTransactionId: response.orderTrackingId,
        providerStatusCode: "PESAPAL_PENDING",
        rawProviderStatus: response.raw,
      });

      return {
        paymentId: payment.id,
        status: "pending",
        providerTransactionId: response.orderTrackingId,
        redirectUrl: response.redirectUrl,
        rawResponse: response.raw,
      };
    }

    // Intouch (mobile money)
    assertIntouchConfig({
      baseUrl: env.INTOUCH_BASE_URL,
      username: env.INTOUCH_USERNAME,
      accountNo: env.INTOUCH_ACCOUNT_NO,
      partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
    });

    const callbackUrl = new URL(
      "/api/billing/intouch/callback",
      getAppBaseUrl(),
    ).toString();

    const response = await requestConfiguredPayment({
      config: {
        baseUrl: env.INTOUCH_BASE_URL,
        username: env.INTOUCH_USERNAME,
        accountNo: env.INTOUCH_ACCOUNT_NO,
        partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
      },
      mobilePhone: normalizedPhone!,
      amount: payment.amount,
      requestTransactionId,
      callbackUrl,
    });

    if (response.state === "failed") {
      alreadyFailed = true;
      await failPayment({
        paymentId: payment.id,
        providerStatusCode: response.responseCode,
        rawProviderStatus: response.raw,
      });
      throw new Error(
        response.message ?? "Failed to initiate mobile money payment.",
      );
    }

    await updatePaymentProviderDetails(payment.id, {
      providerTransactionId: response.transactionId,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });

    return {
      paymentId: payment.id,
      status: response.state,
      providerTransactionId: response.transactionId,
      redirectUrl: null,
      rawResponse: response.raw,
    };
  } catch (error) {
    logger.error("Admin test payment failed", error, {
      source: "admin.test-payment",
    });

    if (!alreadyFailed) {
      await failPayment({
        paymentId: payment.id,
        providerStatusCode: "TEST_PAYMENT_FAILED",
        rawProviderStatus: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }).catch(() => {});
    }

    throw error;
  }
}

export async function adminCheckTestPaymentAction(input: {
  paymentId: number;
}): Promise<ActionResult<CheckResult>> {
  try {
    const data = await runCheckTestPayment(input);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to check status.",
    };
  }
}

async function runCheckTestPayment(input: {
  paymentId: number;
}): Promise<CheckResult> {
  await requireAdmin();

  const payment = await getPaymentById(input.paymentId);
  if (!payment) throw new Error("Payment not found.");

  if (payment.status !== "pending") {
    return { status: payment.status, rawResponse: payment.rawProviderStatus };
  }

  if (payment.providerName === "pesapal") {
    if (
      !env.PESAPAL_BASE_URL ||
      !env.PESAPAL_CONSUMER_KEY ||
      !env.PESAPAL_CONSUMER_SECRET
    ) {
      throw new Error("Pesapal is not configured.");
    }

    const orderTrackingId = payment.providerTransactionId;
    if (!orderTrackingId) {
      return { status: "pending", rawResponse: payment.rawProviderStatus };
    }

    const response = await getPesapalTransactionStatus({
      baseUrl: env.PESAPAL_BASE_URL,
      consumerKey: env.PESAPAL_CONSUMER_KEY,
      consumerSecret: env.PESAPAL_CONSUMER_SECRET,
      orderTrackingId,
    });

    if (response.state === "succeeded") {
      await confirmPaymentSuccess({
        paymentId: payment.id,
        providerTransactionId: response.orderTrackingId ?? orderTrackingId,
        providerReferenceNo: response.confirmationCode,
        providerStatusCode:
          response.paymentStatusCode ?? response.paymentStatusDescription,
        rawProviderStatus: response.raw,
      });
      return { status: "succeeded", rawResponse: response.raw };
    }

    if (response.state === "failed") {
      await failPayment({
        paymentId: payment.id,
        providerStatusCode:
          response.paymentStatusCode ?? response.paymentStatusDescription,
        rawProviderStatus: response.raw,
      });
      return { status: "failed", rawResponse: response.raw };
    }

    return { status: "pending", rawResponse: response.raw };
  }

  if (
    !env.INTOUCH_BASE_URL ||
    !env.INTOUCH_USERNAME ||
    !env.INTOUCH_ACCOUNT_NO ||
    !env.INTOUCH_PARTNER_PASSWORD
  ) {
    throw new Error("Intouch is not configured.");
  }

  const response = await getTransactionStatus({
    baseUrl: env.INTOUCH_BASE_URL,
    username: env.INTOUCH_USERNAME,
    accountNo: env.INTOUCH_ACCOUNT_NO,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
    requestTransactionId: payment.requestTransactionId!,
    transactionId:
      payment.providerTransactionId ?? payment.requestTransactionId!,
  });

  if (response.state === "succeeded") {
    await confirmPaymentSuccess({
      paymentId: payment.id,
      providerTransactionId: response.transactionId,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });
    return { status: "succeeded", rawResponse: response.raw };
  }

  if (response.state === "failed") {
    await failPayment({
      paymentId: payment.id,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });
    return { status: "failed", rawResponse: response.raw };
  }

  return { status: "pending", rawResponse: response.raw };
}
