import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  confirmPaymentSuccess,
  failPayment,
  updatePaymentProviderDetails,
} from "@/lib/services/billing/checkout";
import { getPaymentByRequestTransactionId } from "@/lib/services/billing/reconciliation";
import { getPesapalTransactionStatus } from "@/lib/services/billing/providers/pesapal";
import logger from "@/lib/utils/logger";

function redirectTo(request: Request, pathWithQuery: string) {
  return NextResponse.redirect(new URL(pathWithQuery, request.url));
}

export async function GET(request: Request) {
  try {
    if (
      !env.PESAPAL_BASE_URL ||
      !env.PESAPAL_CONSUMER_KEY ||
      !env.PESAPAL_CONSUMER_SECRET
    ) {
      return redirectTo(request, "/checkout?error=card_not_configured");
    }

    const { searchParams } = new URL(request.url);
    const orderTrackingId = searchParams.get("OrderTrackingId");
    const merchantReference = searchParams.get("OrderMerchantReference");

    if (!orderTrackingId || !merchantReference) {
      return redirectTo(request, "/checkout?error=invalid_callback");
    }

    const payment = await getPaymentByRequestTransactionId(merchantReference);
    if (!payment) {
      return redirectTo(request, "/checkout?error=payment_not_found");
    }

    const status = await getPesapalTransactionStatus({
      baseUrl: env.PESAPAL_BASE_URL,
      consumerKey: env.PESAPAL_CONSUMER_KEY,
      consumerSecret: env.PESAPAL_CONSUMER_SECRET,
      orderTrackingId,
    });

    if (status.state === "succeeded") {
      await confirmPaymentSuccess({
        paymentId: payment.id,
        providerTransactionId: status.orderTrackingId ?? orderTrackingId,
        providerReferenceNo: status.confirmationCode,
        providerStatusCode:
          status.paymentStatusCode ?? status.paymentStatusDescription,
        rawProviderStatus: status.raw,
      });
      return redirectTo(request, "/app/billing?success=payment");
    }

    if (status.state === "failed") {
      await failPayment({
        paymentId: payment.id,
        providerStatusCode:
          status.paymentStatusCode ?? status.paymentStatusDescription,
        rawProviderStatus: status.raw,
      });
      return redirectTo(request, "/checkout?error=payment_failed");
    }

    await updatePaymentProviderDetails(payment.id, {
      providerTransactionId: status.orderTrackingId ?? orderTrackingId,
      providerReferenceNo: status.confirmationCode,
      providerStatusCode:
        status.paymentStatusCode ?? status.paymentStatusDescription,
      rawProviderStatus: status.raw,
    });

    return redirectTo(request, "/checkout?status=pending");
  } catch (error) {
    logger.error("Failed to process Pesapal callback", error);
    return redirectTo(request, "/checkout?error=callback_failed");
  }
}
