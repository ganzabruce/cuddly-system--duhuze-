import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  confirmPaymentSuccess,
  failPayment,
  updatePaymentProviderDetails,
} from "@/lib/services/billing/checkout";
import { getPaymentByRequestTransactionId } from "@/lib/services/billing/reconciliation";
import {
  getPesapalTransactionStatus,
  parsePesapalIpnGetParams,
  parsePesapalIpnPostParams,
  buildPesapalIpnAck,
  type PesapalIpnPayload,
} from "@/lib/services/billing/providers/pesapal";
import logger from "@/lib/utils/logger";

async function handleNotification(payload: PesapalIpnPayload) {
  if (!env.PESAPAL_BASE_URL || !env.PESAPAL_CONSUMER_KEY || !env.PESAPAL_CONSUMER_SECRET) {
    throw new Error("Pesapal not configured.");
  }

  if (!payload.orderTrackingId || !payload.orderMerchantReference) {
    throw new Error("Missing OrderTrackingId or OrderMerchantReference.");
  }

  const payment = await getPaymentByRequestTransactionId(payload.orderMerchantReference);
  if (!payment) throw new Error("Payment not found.");

  const status = await getPesapalTransactionStatus({
    baseUrl: env.PESAPAL_BASE_URL,
    consumerKey: env.PESAPAL_CONSUMER_KEY,
    consumerSecret: env.PESAPAL_CONSUMER_SECRET,
    orderTrackingId: payload.orderTrackingId,
  });

  if (status.state === "succeeded") {
    await confirmPaymentSuccess({
      paymentId: payment.id,
      providerTransactionId: status.orderTrackingId ?? payload.orderTrackingId,
      providerReferenceNo: status.confirmationCode,
      providerStatusCode: status.paymentStatusCode ?? status.paymentStatusDescription,
      rawProviderStatus: status.raw,
    });
    return;
  }

  if (status.state === "failed") {
    await failPayment({
      paymentId: payment.id,
      providerStatusCode: status.paymentStatusCode ?? status.paymentStatusDescription,
      rawProviderStatus: status.raw,
    });
    return;
  }

  await updatePaymentProviderDetails(payment.id, {
    providerTransactionId: status.orderTrackingId ?? payload.orderTrackingId,
    providerReferenceNo: status.confirmationCode,
    providerStatusCode: status.paymentStatusCode ?? status.paymentStatusDescription,
    rawProviderStatus: status.raw,
  });
}

export async function GET(request: Request) {
  const payload = parsePesapalIpnGetParams(request);
  try {
    await handleNotification(payload);
    return NextResponse.json(buildPesapalIpnAck(payload, 200));
  } catch (error) {
    logger.error("Failed to process Pesapal IPN GET", error, payload);
    return NextResponse.json(buildPesapalIpnAck(payload, 500));
  }
}

export async function POST(request: Request) {
  const payload = await parsePesapalIpnPostParams(request);
  try {
    await handleNotification(payload);
    return NextResponse.json(buildPesapalIpnAck(payload, 200));
  } catch (error) {
    logger.error("Failed to process Pesapal IPN POST", error, payload);
    return NextResponse.json(buildPesapalIpnAck(payload, 500));
  }
}
