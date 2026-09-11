// Official IntouchPay response codes — HTTP API PDF (§2.9 RequestPayment, §3.7 RequestDeposit)
// https://intouchpay.co.rw/static/files/http_intouchpay_api.pdf

export const INTOUCH_PAYMENT_CODES: Record<string, string> = {
  "1000": "Pending",
  "01": "Successful",
  "0002": "Missing username information",
  "0003": "Missing password information",
  "0004": "Missing date information",
  "0005": "Invalid password",
  "0006": "User does not have an IntouchPay account",
  "0007": "No such user",
  "0008": "Failed to authenticate",
  "2100": "Amount should be greater than 0",
  "2200": "Amount below minimum",
  "2300": "Amount above maximum",
  "2400": "Duplicate transaction ID",
  "2500": "Route not found",
  "2600": "Operation not allowed",
  "2700": "Failed to complete transaction",
  "1005": "Failed due to insufficient funds",
  "1002": "Mobile number not registered on mobile money",
  "1008": "General failure",
  "1200": "Invalid number",
  "1100": "Number not supported on this mobile money network",
  "1300": "Failed to complete transaction, unknown exception",
};

export const INTOUCH_DEPOSIT_CODES: Record<string, string> = {
  "2001": "Request successful",
  "0002": "Missing username information",
  "0003": "Missing password information",
  "0004": "Missing date information",
  "0005": "Invalid password",
  "0006": "User does not have an IntouchPay account",
  "0007": "No such user",
  "0008": "Failed to authenticate",
  "1100": "Error in request",
  "1101": "Service ID not recognized",
  "1102": "Invalid mobile phone number",
  "1103": "Payment above allowed maximum",
  "1104": "Payment below allowed minimum",
  "1105": "Network not supported",
  "1106": "Operation not permitted",
  "1107": "Payment account not configured",
  "1108": "Insufficient account balance",
  "1110": "Duplicate remit ID",
  "2003": "Transaction not allowed",
  "2102": "Subscriber could not be identified",
  "2105": "Non-existent mobile account",
  "2106": "Own mobile account provided",
  "2107": "Invalid amount format",
  "2108": "Insufficient funds on source account",
  "2109": "Daily limit exceeded",
  "2110": "Source account not active",
  "2111": "Mobile account not active",
  "2000": "General failure",
  "2500": "Service failure",
  "2510": "Service temporarily unavailable",
  "2518": "Could not perform operation",
  "2520": "Incorrect account password",
  "2522": "Invalid amount",
  "2525": "Resource not active",
  "2600": "Network failure — request timed out",
  "2800": "Deposit channel failure",
};

function describeCode(
  codes: Record<string, string>,
  code: string | number | null | undefined,
): string {
  const normalized = String(code ?? "").trim();
  if (!normalized) return "Unknown IntouchPay response (no response code)";
  return codes[normalized] ?? `Unknown IntouchPay response code ${normalized}`;
}

export function describeIntouchPaymentCode(
  code: string | number | null | undefined,
): string {
  return describeCode(INTOUCH_PAYMENT_CODES, code);
}

export function describeIntouchDepositCode(
  code: string | number | null | undefined,
): string {
  return describeCode(INTOUCH_DEPOSIT_CODES, code);
}
