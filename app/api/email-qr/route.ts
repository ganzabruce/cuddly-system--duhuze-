import { generateGuestLinkQrBuffer, resolveSignedEmailQrTarget } from "@/lib/services/events/qr";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const payload = url.searchParams.get("payload") ?? "";
  const signature = url.searchParams.get("sig") ?? "";
  const targetUrl = resolveSignedEmailQrTarget(payload, signature);

  if (!targetUrl) {
    return new Response("Invalid QR request", { status: 400 });
  }

  const imageBuffer = await generateGuestLinkQrBuffer(targetUrl);

  return new Response(new Uint8Array(imageBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
