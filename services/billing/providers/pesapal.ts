import { ValidationError } from "@/lib/utils/errors";

export type PesapalNormalizedState = "pending" | "succeeded" | "failed";

// Shared IPN/callback utilities used by both billing and event payment webhook handlers

export type PesapalIpnPayload = {
  orderTrackingId: string | null;
  orderMerchantReference: string | null;
  orderNotificationType: string | null;
};

export function parsePesapalIpnGetParams(request: Request): PesapalIpnPayload {
  const { searchParams } = new URL(request.url);
  return {
    orderTrackingId: searchParams.get("OrderTrackingId"),
    orderMerchantReference: searchParams.get("OrderMerchantReference"),
    orderNotificationType: searchParams.get("OrderNotificationType"),
  };
}

export async function parsePesapalIpnPostParams(request: Request): Promise<PesapalIpnPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      orderTrackingId: typeof body.OrderTrackingId === "string" ? body.OrderTrackingId : null,
      orderMerchantReference: typeof body.OrderMerchantReference === "string" ? body.OrderMerchantReference : null,
      orderNotificationType: typeof body.OrderNotificationType === "string" ? body.OrderNotificationType : null,
    };
  }

  const formData = await request.formData();
  const getString = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : null;
  };

  return {
    orderTrackingId: getString("OrderTrackingId"),
    orderMerchantReference: getString("OrderMerchantReference"),
    orderNotificationType: getString("OrderNotificationType"),
  };
}

export function buildPesapalIpnAck(payload: PesapalIpnPayload, status: 200 | 500) {
  return {
    orderNotificationType: payload.orderNotificationType || "IPNCHANGE",
    orderTrackingId: payload.orderTrackingId || "",
    orderMerchantReference: payload.orderMerchantReference || "",
    status,
  };
}

export type PesapalRegisterOrderInput = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  notificationId: string;
  merchantReference: string;
  description: string;
  amount: number;
  currency: string;
  callbackUrl?: string;
  billingAddress?: {
    email_address?: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
  fetchImpl?: typeof fetch;
};

export type PesapalRegisterOrderResponse = {
  success: boolean;
  orderTrackingId: string | null;
  merchantReference: string | null;
  redirectUrl: string | null;
  status: string | null;
  message: string | null;
  raw: unknown;
};

export type PesapalTransactionStatusInput = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  orderTrackingId: string;
  fetchImpl?: typeof fetch;
};

export type PesapalTransactionStatusResponse = {
  success: boolean;
  orderTrackingId: string | null;
  merchantReference: string | null;
  paymentMethod: string | null;
  amount: number | null;
  currency: string | null;
  confirmationCode: string | null;
  paymentStatusDescription: string | null;
  paymentStatusCode: string | null;
  statusCode: number | null;
  state: PesapalNormalizedState;
  message: string | null;
  raw: unknown;
};

export type PesapalTokenResponse = {
  token: string;
  expiryDate: string | null;
  raw: unknown;
};

type PesapalErrorPayload = {
  error?: {
    type?: string;
    code?: string;
    message?: string;
  } | null;
  message?: string;
  status?: string;
};

function trimBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new ValidationError("Missing Pesapal base URL.");
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function requireValue(value: string | null | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ValidationError(`Missing Pesapal ${name}.`);
  }
  return trimmed;
}

function normalizeStatusCode(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function getPesapalErrorMessage(payload: PesapalErrorPayload): string | null {
  const nested = payload.error?.message?.trim();
  if (nested) {
    return nested;
  }

  const direct = payload.message?.trim();
  if (direct) {
    return direct;
  }

  return null;
}

export function normalizePesapalState(input: {
  statusCode?: number | null;
  paymentStatusDescription?: string | null;
  errorCode?: string | null;
}): PesapalNormalizedState {
  if (input.statusCode === 1) return "succeeded";

  if (input.statusCode === 0) {
    if (input.errorCode === "payment_details_not_found") return "pending";
    return "failed";
  }

  if (input.statusCode === 2 || input.statusCode === 3) {
    return "failed";
  }

  const normalized = input.paymentStatusDescription?.trim().toUpperCase();
  if (normalized === "COMPLETED") return "succeeded";
  if (normalized === "FAILED" || normalized === "REVERSED") {
    return "failed";
  }
  if (normalized === "INVALID") {
    if (input.errorCode === "payment_details_not_found") return "pending";
    return "failed";
  }

  return "pending";
}

export async function getPesapalToken(input: {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  fetchImpl?: typeof fetch;
}): Promise<PesapalTokenResponse> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = trimBaseUrl(input.baseUrl);
  const consumerKey = requireValue(input.consumerKey, "consumer key");
  const consumerSecret = requireValue(input.consumerSecret, "consumer secret");

  const response = await fetchImpl(`${baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const raw = await response.json();
  const payload = raw as {
    token?: string;
    expiryDate?: string;
    status?: string;
    message?: string;
    error?: {
      type?: string;
      code?: string;
      message?: string;
    } | null;
  };

  if (!response.ok || !payload?.token || payload.status !== "200") {
    throw new ValidationError(
      getPesapalErrorMessage(payload) || "Pesapal token request failed.",
    );
  }

  return {
    token: payload.token,
    expiryDate: payload.expiryDate ?? null,
    raw,
  };
}

export async function registerPesapalOrder(
  input: PesapalRegisterOrderInput,
): Promise<PesapalRegisterOrderResponse> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = trimBaseUrl(input.baseUrl);
  const merchantReference = requireValue(
    input.merchantReference,
    "merchant reference",
  );

  const token = await getPesapalToken({
    baseUrl,
    consumerKey: input.consumerKey,
    consumerSecret: input.consumerSecret,
    fetchImpl,
  });

  const response = await fetchImpl(
    `${baseUrl}/api/Transactions/SubmitOrderRequest`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        id: merchantReference,
        currency: input.currency,
        amount: input.amount,
        description: input.description,
        ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
        notification_id: input.notificationId,
        billing_address: input.billingAddress ?? {},
      }),
    },
  );

  const raw = await response.json();
  const payload = raw as {
    order_tracking_id?: string;
    merchant_reference?: string;
    redirect_url?: string;
    status?: string;
    message?: string;
    error?: {
      type?: string;
      code?: string;
      message?: string;
    } | null;
  };

  return {
    success: response.ok && payload?.status === "200",
    orderTrackingId: payload?.order_tracking_id ?? null,
    merchantReference: payload?.merchant_reference ?? null,
    redirectUrl: payload?.redirect_url ?? null,
    status: payload?.status ?? null,
    message: getPesapalErrorMessage(payload),
    raw,
  };
}

export async function getPesapalTransactionStatus(
  input: PesapalTransactionStatusInput,
): Promise<PesapalTransactionStatusResponse> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = trimBaseUrl(input.baseUrl);
  const orderTrackingId = requireValue(
    input.orderTrackingId,
    "order tracking id",
  );

  const token = await getPesapalToken({
    baseUrl,
    consumerKey: input.consumerKey,
    consumerSecret: input.consumerSecret,
    fetchImpl,
  });

  const url = new URL(`${baseUrl}/api/Transactions/GetTransactionStatus`);
  url.searchParams.set("orderTrackingId", orderTrackingId);

  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
  });

  const raw = await response.json();
  const payload = raw as {
    payment_method?: string;
    amount?: number | string;
    confirmation_code?: string;
    payment_status_description?: string;
    merchant_reference?: string;
    currency?: string;
    status_code?: number | string;
    message?: string;
    order_tracking_id?: string;
    status?: string;
    error?: {
      type?: string;
      code?: string;
      message?: string;
    } | null;
  };

  const statusCode = normalizeStatusCode(payload?.status_code);
  const state = normalizePesapalState({
    statusCode,
    paymentStatusDescription: payload?.payment_status_description ?? null,
    errorCode: payload?.error?.code ?? null,
  });

  return {
    success: response.ok && payload?.status === "200",
    orderTrackingId: payload?.order_tracking_id ?? orderTrackingId,
    merchantReference: payload?.merchant_reference ?? null,
    paymentMethod: payload?.payment_method ?? null,
    amount:
      payload?.amount == null || Number.isNaN(Number(payload.amount))
        ? null
        : Number(payload.amount),
    currency: payload?.currency ?? null,
    confirmationCode: payload?.confirmation_code ?? null,
    paymentStatusDescription: payload?.payment_status_description ?? null,
    paymentStatusCode: statusCode == null ? null : String(statusCode),
    statusCode,
    state,
    message: getPesapalErrorMessage(payload),
    raw,
  };
}
