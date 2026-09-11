import { NextResponse } from "next/server";
import {
  parseEventPaymentCallbackPayload,
  finalizeEventPaymentFromCallback,
} from "@/lib/services/events/payments/callback";
import {
  buildCallbackResponse,
  verifyCallbackAuthorization,
} from "@/lib/services/billing/providers/intouch";
import { env } from "@/lib/env";
import logger from "@/lib/utils/logger";

export async function POST(request: Request) {
  let requestTransactionId: string | null = null;
  let message = "success";

  if (
    !verifyCallbackAuthorization(request.headers.get("authorization"), {
      username: env.INTOUCH_CALLBACK_USERNAME,
      password: env.INTOUCH_CALLBACK_PASSWORD,
    })
  ) {
    logger.error("Rejected unauthorized event payment callback");
    return NextResponse.json(
      buildCallbackResponse(null, false, "unauthorized"),
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const payload = parseEventPaymentCallbackPayload(body);
    requestTransactionId = payload.requestTransactionId;

    await finalizeEventPaymentFromCallback(payload, body);
  } catch (error) {
    message = "failed";
    logger.error("Failed to process event payment callback", error);
  }

  return NextResponse.json(
    buildCallbackResponse(requestTransactionId, true, message),
  );
}
