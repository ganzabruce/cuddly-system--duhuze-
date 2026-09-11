import { NextResponse } from "next/server";
import { finalizePaymentFromCallback } from "@/lib/services/billing/checkout";
import {
  buildCallbackResponse,
  parseCallbackPayload,
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
    logger.error("Rejected unauthorized Intouch callback");
    return NextResponse.json(
      buildCallbackResponse(null, false, "unauthorized"),
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const payload = parseCallbackPayload(body);
    requestTransactionId = payload.requestTransactionId;

    await finalizePaymentFromCallback(payload, body);
  } catch (error) {
    message = "failed";
    logger.error("Failed to process Intouch callback", error);
  }

  return NextResponse.json(
    buildCallbackResponse(requestTransactionId, true, message),
  );
}
