import { ValidationError } from "@/lib/utils/errors";
import { toIntouchPhone } from "@/lib/utils/phone";
import {
  describeIntouchPaymentCode,
  describeIntouchDepositCode,
} from "@/lib/constants/billing/intouch-codes";
import { createHash, timingSafeEqual } from "crypto";

export type IntouchPaymentState = "pending" | "succeeded" | "failed";

export type IntouchRequestPaymentInput = {
  baseUrl: string;
  username: string;
  accountNo: string;
  partnerPassword: string;
  mobilePhone: string;
  amount: number;
  requestTransactionId: string;
  callbackUrl?: string | null;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
};

export type IntouchTransactionStatusInput = {
  baseUrl: string;
  username: string;
  accountNo: string;
  partnerPassword: string;
  requestTransactionId: string;
  transactionId: string | number;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
};

export type IntouchRequestDepositInput = {
  baseUrl: string;
  username: string;
  accountNo: string;
  partnerPassword: string;
  mobilePhone: string;
  amount: number;
  requestTransactionId: string;
  reason: string;
  withdrawCharge: 0 | 1;
  sid?: number;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
};

export type IntouchRequestPaymentResponse = {
  success: boolean;
  state: IntouchPaymentState;
  responseCode: string | null;
  requestTransactionId: string | null;
  transactionId: string | null;
  message: string | null;
  raw: unknown;
};

export type IntouchTransactionStatusResponse = {
  success: boolean;
  state: IntouchPaymentState;
  responseCode: string | null;
  requestTransactionId: string | null;
  transactionId: string | null;
  message: string | null;
  raw: unknown;
};

export type IntouchRequestDepositResponse = {
  success: boolean;
  state: IntouchPaymentState;
  responseCode: string | null;
  requestTransactionId: string | null;
  referenceId: string | null;
  message: string | null;
  raw: unknown;
};

export type IntouchBalanceResponse = {
  success: boolean;
  balance: number | null;
  responseCode: string | null;
  message: string | null;
  raw: unknown;
};

export type IntouchCallbackPayload = {
  requesttransactionid?: string;
  transactionid?: string | number;
  responsecode?: string | number;
  status?: string;
  statusdesc?: string;
  referenceno?: string;
};

export type IntouchNormalizedCallback = {
  requestTransactionId: string;
  transactionId: string | null;
  responseCode: string | null;
  state: IntouchPaymentState;
  status: string | null;
  statusDescription: string | null;
  referenceNo: string | null;
  raw: IntouchCallbackPayload;
};

export type IntouchCallbackAuthConfig = {
  username?: string | null;
  password?: string | null;
};

export type IntouchConfig = {
  baseUrl?: string | null;
  username?: string | null;
  accountNo?: string | null;
  partnerPassword?: string | null;
};


function assertConfig(value: string | null | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ValidationError(`Missing Intouch ${name}.`);
  }
  return trimmed;
}

export function assertIntouchConfig(config: IntouchConfig) {
  return {
    baseUrl: assertConfig(config.baseUrl, "base URL"),
    username: assertConfig(config.username, "username"),
    accountNo: assertConfig(config.accountNo, "account number"),
    partnerPassword: assertConfig(config.partnerPassword, "partner password"),
  };
}

export function formatTimestamp(date = new Date()): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function buildPassword(input: {
  username: string;
  accountNo: string;
  partnerPassword: string;
  timestamp: string;
}): string {
  const source =
    input.username + input.accountNo + input.partnerPassword + input.timestamp;
  return createHash("sha256").update(source).digest("hex");
}


function getBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new ValidationError("Missing Intouch base URL.");
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function normalizeStateFromResponseCode(
  responseCode: string | number | null | undefined,
  status?: string | null,
): IntouchPaymentState {
  const code = String(responseCode ?? "").trim();
  const normalizedStatus = status?.trim().toLowerCase();

  if (code === "1000" || normalizedStatus === "pending") {
    return "pending";
  }

  if (
    code === "01" ||
    code === "2001" ||
    normalizedStatus === "successful" ||
    normalizedStatus === "successfull"
  ) {
    return "succeeded";
  }

  return "failed";
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { rawText: text };
  }
}

function readStringField(raw: unknown, key: string): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function extractGatewayError(raw: unknown, httpStatus: number): string | null {
  const text =
    readStringField(raw, "detail") ??
    readStringField(raw, "rawText")?.trim().slice(0, 300) ??
    null;
  if (text) {
    return httpStatus >= 400 ? `Intouch HTTP ${httpStatus}: ${text}` : text;
  }
  return httpStatus >= 400 ? `Intouch HTTP ${httpStatus}` : null;
}


export async function requestPayment(
  input: IntouchRequestPaymentInput,
): Promise<IntouchRequestPaymentResponse> {
  const baseUrl = getBaseUrl(input.baseUrl);
  const username = assertConfig(input.username, "username");
  const accountNo = assertConfig(input.accountNo, "account number");
  const partnerPassword = assertConfig(input.partnerPassword, "partner password");
  const mobilePhone = assertConfig(input.mobilePhone, "mobile phone");
  const requestTransactionId = assertConfig(
    input.requestTransactionId,
    "request transaction id",
  );
  const timestamp = formatTimestamp(input.timestamp);
  const password = buildPassword({
    username,
    accountNo,
    partnerPassword,
    timestamp,
  });
  const body = new URLSearchParams({
    username,
    timestamp,
    amount: String(input.amount),
    password,
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId,
    accountno: accountNo,
  });

  if (input.callbackUrl) {
    body.set("callbackurl", input.callbackUrl);
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(`${baseUrl}/requestpayment/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await parseJsonResponse(response);
  const top = raw as {
    success?: boolean;
    responsecode?: string | number;
    requesttransactionid?: string;
    transactionid?: string | number;
    message?: string;
    status?: string;
    response?: {
      statuscode?: string | number;
      msg?: string;
      status?: string;
    };
  } | null;

  // API sometimes nests fields under a "response" key
  const nested = top?.response ?? null;
  const responseCode = top?.responsecode ?? nested?.statuscode ?? null;
  const message = top?.message ?? nested?.msg ?? null;
  const status = top?.status ?? nested?.status ?? null;

  return {
    success: response.ok && (top?.success ?? false),
    state: normalizeStateFromResponseCode(responseCode, status),
    responseCode: responseCode != null ? String(responseCode) : null,
    requestTransactionId: top?.requesttransactionid ?? requestTransactionId,
    transactionId: top?.transactionid != null ? String(top.transactionid) : null,
    message:
      message ??
      (responseCode != null
        ? describeIntouchPaymentCode(responseCode)
        : (extractGatewayError(raw, response.status) ??
          describeIntouchPaymentCode(null))),
    raw,
  };
}

export async function requestConfiguredPayment(input: {
  config: IntouchConfig;
  mobilePhone: string;
  amount: number;
  requestTransactionId: string;
  callbackUrl?: string | null;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
}): Promise<IntouchRequestPaymentResponse> {
  const config = assertIntouchConfig(input.config);
  const mobilePhone = toIntouchPhone(input.mobilePhone);

  return requestPayment({
    baseUrl: config.baseUrl,
    username: config.username,
    accountNo: config.accountNo,
    partnerPassword: config.partnerPassword,
    mobilePhone,
    amount: input.amount,
    requestTransactionId: input.requestTransactionId,
    callbackUrl: input.callbackUrl,
    timestamp: input.timestamp,
    fetchImpl: input.fetchImpl,
  });
}

export async function requestConfiguredDeposit(input: {
  config: IntouchConfig;
  mobilePhone: string;
  amount: number;
  requestTransactionId: string;
  reason: string;
  withdrawCharge: 0 | 1;
  sid?: number;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
}): Promise<IntouchRequestDepositResponse> {
  const config = assertIntouchConfig(input.config);
  const mobilePhone = toIntouchPhone(input.mobilePhone);

  return requestDeposit({
    baseUrl: config.baseUrl,
    username: config.username,
    accountNo: config.accountNo,
    partnerPassword: config.partnerPassword,
    mobilePhone,
    amount: input.amount,
    requestTransactionId: input.requestTransactionId,
    reason: input.reason,
    withdrawCharge: input.withdrawCharge,
    sid: input.sid,
    timestamp: input.timestamp,
    fetchImpl: input.fetchImpl,
  });
}

export async function requestDeposit(
  input: IntouchRequestDepositInput,
): Promise<IntouchRequestDepositResponse> {
  const baseUrl = getBaseUrl(input.baseUrl);
  const username = assertConfig(input.username, "username");
  const accountNo = assertConfig(input.accountNo, "account number");
  const partnerPassword = assertConfig(input.partnerPassword, "partner password");
  const mobilePhone = assertConfig(input.mobilePhone, "mobile phone");
  const requestTransactionId = assertConfig(
    input.requestTransactionId,
    "request transaction id",
  );
  const reason = assertConfig(input.reason, "deposit reason");
  const timestamp = formatTimestamp(input.timestamp);
  const password = buildPassword({
    username,
    accountNo,
    partnerPassword,
    timestamp,
  });

  const body = new URLSearchParams({
    username,
    timestamp,
    amount: String(input.amount),
    withdrawcharge: String(input.withdrawCharge),
    reason,
    sid: String(input.sid ?? 1),
    password,
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId,
    accountno: accountNo,
  });

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(`${baseUrl}/requestdeposit/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await parseJsonResponse(response);
  const payload = raw as {
    success?: boolean;
    responsecode?: string | number;
    requesttransactionid?: string;
    referenceid?: string | number;
    message?: string;
    status?: string;
  } | null;

  return {
    success: response.ok && (payload?.success ?? false),
    state: normalizeStateFromResponseCode(
      payload?.responsecode ?? null,
      payload?.status ?? null,
    ),
    responseCode: payload?.responsecode != null ? String(payload.responsecode) : null,
    requestTransactionId: payload?.requesttransactionid ?? requestTransactionId,
    referenceId: payload?.referenceid != null ? String(payload.referenceid) : null,
    message:
      payload?.message ??
      (payload?.responsecode != null
        ? describeIntouchDepositCode(payload.responsecode)
        : (extractGatewayError(raw, response.status) ??
          describeIntouchDepositCode(null))),
    raw,
  };
}

export async function getTransactionStatus(
  input: IntouchTransactionStatusInput,
): Promise<IntouchTransactionStatusResponse> {
  const baseUrl = getBaseUrl(input.baseUrl);
  const username = assertConfig(input.username, "username");
  const accountNo = assertConfig(input.accountNo, "account number");
  const partnerPassword = assertConfig(input.partnerPassword, "partner password");
  const requestTransactionId = assertConfig(
    input.requestTransactionId,
    "request transaction id",
  );
  const transactionId = String(input.transactionId).trim();
  if (!transactionId) {
    throw new ValidationError("Missing Intouch transaction id.");
  }
  const timestamp = formatTimestamp(input.timestamp);
  const password = buildPassword({
    username,
    accountNo,
    partnerPassword,
    timestamp,
  });
  const fetchImpl = input.fetchImpl ?? fetch;

  const response = await fetchImpl(`${baseUrl}/gettransactionstatus/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      timestamp,
      password,
      requesttransactionid: requestTransactionId,
      transactionid: transactionId,
    }),
  });

  const raw = await parseJsonResponse(response);
  const payload = raw as {
    success?: boolean;
    responsecode?: string | number;
    requesttransactionid?: string;
    transactionid?: string | number;
    message?: string;
    status?: string;
  } | null;

  return {
    success: response.ok && (payload?.success ?? false),
    state: normalizeStateFromResponseCode(
      payload?.responsecode ?? null,
      payload?.status ?? null,
    ),
    responseCode: payload?.responsecode != null ? String(payload.responsecode) : null,
    requestTransactionId: payload?.requesttransactionid ?? requestTransactionId,
    transactionId:
      payload?.transactionid != null ? String(payload.transactionid) : transactionId,
    message:
      payload?.message ??
      (payload?.responsecode != null
        ? describeIntouchPaymentCode(payload.responsecode)
        : (extractGatewayError(raw, response.status) ??
          describeIntouchPaymentCode(null))),
    raw,
  };
}

export async function getBalance(input: {
  baseUrl: string;
  username: string;
  accountNo: string;
  partnerPassword: string;
  timestamp?: Date;
  fetchImpl?: typeof fetch;
}): Promise<IntouchBalanceResponse> {
  const baseUrl = getBaseUrl(input.baseUrl);
  const username = assertConfig(input.username, "username");
  const accountNo = assertConfig(input.accountNo, "account number");
  const partnerPassword = assertConfig(input.partnerPassword, "partner password");
  const timestamp = formatTimestamp(input.timestamp);
  const password = buildPassword({
    username,
    accountNo,
    partnerPassword,
    timestamp,
  });

  const body = new URLSearchParams({
    username,
    timestamp,
    password,
    accountno: accountNo,
  });

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(`${baseUrl}/getbalance/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await parseJsonResponse(response);
  const payload = raw as {
    success?: boolean;
    balance?: string | number;
    responsecode?: string | number;
    message?: string;
  } | null;

  const balanceValue =
    payload?.balance != null && !Number.isNaN(Number(payload.balance))
      ? Number(payload.balance)
      : null;

  return {
    success: response.ok && (payload?.success ?? false),
    balance: balanceValue,
    responseCode: payload?.responsecode != null ? String(payload.responsecode) : null,
    message: payload?.message ?? null,
    raw,
  };
}

export function parseCallbackPayload(body: unknown): IntouchNormalizedCallback {
  const payload = body as {
    jsonpayload?: IntouchCallbackPayload | string;
    requesttransactionid?: string;
  } | null;

  const rawPayload =
    typeof payload?.jsonpayload === "string"
      ? (() => {
          try {
            return JSON.parse(payload.jsonpayload) as IntouchCallbackPayload;
          } catch {
            return null;
          }
        })()
      : payload?.jsonpayload ?? (body as IntouchCallbackPayload);
  const raw = rawPayload ?? (body as IntouchCallbackPayload);
  const requestTransactionId = String(
    raw?.requesttransactionid ?? payload?.requesttransactionid ?? "",
  ).trim();

  if (!requestTransactionId) {
    throw new ValidationError("Missing Intouch request transaction id.");
  }

  const responseCode =
    raw?.responsecode != null ? String(raw.responsecode) : null;
  const status = raw?.status ?? null;

  return {
    requestTransactionId,
    transactionId: raw?.transactionid != null ? String(raw.transactionid) : null,
    responseCode,
    state: normalizeStateFromResponseCode(responseCode, status),
    status,
    statusDescription: raw?.statusdesc ?? null,
    referenceNo: raw?.referenceno ?? null,
    raw,
  };
}

export type IntouchProviderUpdateDetails = {
  providerTransactionId?: string | null;
  providerReferenceNo?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
};

export async function finalizeCallbackPayment<T extends { id: number }>(input: {
  payload: Pick<IntouchNormalizedCallback, "requestTransactionId" | "transactionId" | "responseCode" | "referenceNo">;
  body: unknown;
  config: IntouchConfig;
  findByRequestTransactionId: (requestTransactionId: string) => Promise<T | null>;
  getStoredRequestTransactionId: (record: T) => string | null | undefined;
  getStoredTransactionId: (record: T) => string | null | undefined;
  updateProviderDetails: (recordId: number, details: IntouchProviderUpdateDetails) => Promise<T>;
  markSucceeded: (record: T, details: IntouchProviderUpdateDetails & { transactionId: string }) => Promise<T>;
  markFailed: (record: T, details: IntouchProviderUpdateDetails & { transactionId: string }) => Promise<T>;
}): Promise<T | null> {
  const record = await input.findByRequestTransactionId(input.payload.requestTransactionId);
  if (!record) {
    return null;
  }

  const transactionId =
    input.payload.transactionId ??
    input.getStoredTransactionId(record) ??
    input.getStoredRequestTransactionId(record);

  if (!transactionId) {
    return input.updateProviderDetails(record.id, {
      providerReferenceNo: input.payload.referenceNo,
      providerStatusCode: input.payload.responseCode,
      rawProviderStatus: input.body,
    });
  }

  const config = assertIntouchConfig(input.config);
  const verified = await getTransactionStatus({
    baseUrl: config.baseUrl,
    username: config.username,
    accountNo: config.accountNo,
    partnerPassword: config.partnerPassword,
    requestTransactionId:
      input.getStoredRequestTransactionId(record) ??
      input.payload.requestTransactionId,
    transactionId,
  });

  const details: IntouchProviderUpdateDetails = {
    providerTransactionId: verified.transactionId ?? transactionId,
    providerReferenceNo: input.payload.referenceNo,
    providerStatusCode: verified.responseCode ?? input.payload.responseCode,
    rawProviderStatus: {
      callback: input.body,
      verifiedStatus: verified.raw,
    },
  };

  if (verified.state === "succeeded") {
    return input.markSucceeded(record, {
      ...details,
      transactionId: verified.transactionId ?? transactionId,
    });
  }

  if (verified.state === "failed") {
    return input.markFailed(record, {
      ...details,
      transactionId: verified.transactionId ?? transactionId,
    });
  }

  return input.updateProviderDetails(record.id, details);
}

export function verifyCallbackAuthorization(
  authorizationHeader: string | null | undefined,
  config: IntouchCallbackAuthConfig,
): boolean {
  const username = config.username?.trim();
  const password = config.password?.trim();

  if (!username && !password) {
    return true;
  }

  if (!username || !password || !authorizationHeader) {
    return false;
  }

  const expected = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  const normalizedHeader = authorizationHeader.trim();
  const expectedHeader = `Basic ${expected}`;
  const left = Buffer.from(normalizedHeader, "utf8");
  const right = Buffer.from(expectedHeader, "utf8");

  return left.length === right.length && timingSafeEqual(left, right);
}

export function buildCallbackResponse(
  requestTransactionId: string | null,
  success: boolean,
  message: string = success ? "success" : "failed",
) {
  return {
    message,
    success,
    request_id: requestTransactionId,
  };
}
