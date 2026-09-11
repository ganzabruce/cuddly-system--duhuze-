import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { getAppBaseUrl } from "@/lib/utils/url";
import { env } from "@/lib/env";

const QR_OPTIONS = {
  width: 200,
  margin: 2,
  color: { dark: "#0a0a0a", light: "#fafafa" },
} as const;

const EMAIL_QR_ALLOWED_PATH =
  /^\/u\/[^/]+\/events\/[^/]+\/(?:invite|guest)\/[^/?#]+$/;
const EMAIL_QR_SIGNING_SECRET =
  env.EMAIL_QR_SIGNING_SECRET ?? env.CLERK_SECRET_KEY;

/**
 * Generate a QR code as a PNG Buffer for a guest-facing event link.
 */
export async function generateGuestLinkQrBuffer(
  guestLink: string,
  size = QR_OPTIONS.width,
): Promise<Buffer> {
  return QRCode.toBuffer(guestLink, {
    ...QR_OPTIONS,
    width: size,
  });
}

function signEmailQrPayload(payload: string): string {
  return createHmac("sha256", EMAIL_QR_SIGNING_SECRET)
    .update(payload)
    .digest("base64url");
}

function isValidEmailQrPath(pathname: string): boolean {
  return EMAIL_QR_ALLOWED_PATH.test(pathname);
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function buildEmailQrImageUrl(targetUrl: string): string {
  const appBaseUrl = getAppBaseUrl();
  const appOrigin = new URL(appBaseUrl).origin;
  const parsedTarget = new URL(targetUrl);

  if (parsedTarget.origin !== appOrigin) {
    throw new Error("Email QR targets must be app-hosted URLs");
  }

  if (!isValidEmailQrPath(parsedTarget.pathname)) {
    throw new Error("Email QR targets must be guest or invite event links");
  }

  const payload = Buffer.from(parsedTarget.pathname, "utf8").toString("base64url");
  const sig = signEmailQrPayload(payload);
  const qrUrl = new URL("/api/email-qr", appBaseUrl);
  qrUrl.searchParams.set("payload", payload);
  qrUrl.searchParams.set("sig", sig);
  return qrUrl.toString();
}

export function resolveSignedEmailQrTarget(
  payload: string,
  signature: string,
): string | null {
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signEmailQrPayload(payload);
  if (!safeCompare(expectedSignature, signature)) {
    return null;
  }

  try {
    const pathname = Buffer.from(payload, "base64url").toString("utf8");
    if (!isValidEmailQrPath(pathname)) {
      return null;
    }

    return new URL(pathname, getAppBaseUrl()).toString();
  } catch {
    return null;
  }
}
