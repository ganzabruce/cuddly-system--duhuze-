"use server";

import type { FormState } from "@/types/marketing";

import { sendEmail } from "@/lib/email/send";
import { EMAIL_BRAND_NAME } from "@/lib/constants/brand";
import { CONTACT_SUBJECTS } from "@/components/marketing/contact-content";
import { SUPPORT_CATEGORIES } from "@/components/marketing/support-content";

// PUBLIC ACTION — no auth by design (public contact form)
export async function submitContactForm(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const honeypot = formData.get("website");
  if (honeypot) {
    return { success: true };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  const fieldErrors: Record<string, string> = {};

  if (!name || name.length < 2) {
    fieldErrors.name = "Name must be at least 2 characters.";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (!subject || !CONTACT_SUBJECTS.includes(subject as (typeof CONTACT_SUBJECTS)[number])) {
    fieldErrors.subject = "Please select a subject.";
  }
  if (!message || message.length < 10) {
    fieldErrors.message = "Message must be at least 10 characters.";
  }
  if (message && message.length > 5000) {
    fieldErrors.message = "Message must be under 5,000 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  const result = await sendEmail({
    to: "info@rsvp-duhuze.com",
    subject: `[Contact] ${subject} - from ${name}`,
    html: `
        <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="margin-bottom: 4px;">New contact form submission</h2>
        <p style="color: #666; margin-top: 0;">From the ${escapeHtml(EMAIL_BRAND_NAME)} website</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="white-space: pre-line;">${escapeHtml(message)}</p>
      </div>
    `,
  });

  if (!result.ok) {
    return { success: false, error: "Failed to send message. Please try again later." };
  }

  return { success: true };
}

// PUBLIC ACTION — no auth by design (public support form)
export async function submitSupportForm(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const honeypot = formData.get("website");
  if (honeypot) return { success: true };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const eventRef = (formData.get("eventRef") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const attachmentsRaw = (formData.get("attachments") as string)?.trim();
  const attachments: { url: string; name: string }[] = attachmentsRaw ? JSON.parse(attachmentsRaw) : [];

  const fieldErrors: Record<string, string> = {};
  if (!name || name.length < 2) fieldErrors.name = "Name must be at least 2 characters.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (!category || !SUPPORT_CATEGORIES.includes(category as (typeof SUPPORT_CATEGORIES)[number])) fieldErrors.category = "Please select a category.";
  if (!message || message.length < 10) fieldErrors.message = "Message must be at least 10 characters.";
  if (message && message.length > 5000) fieldErrors.message = "Message must be under 5,000 characters.";
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  const eventLine = eventRef ? `<p><strong>Event:</strong> ${escapeHtml(eventRef)}</p>` : "";
  const attachmentsHtml = attachments.length
    ? `<p><strong>Attachments:</strong></p><ul>${attachments.map(a => `<li><a href="${escapeHtml(a.url)}">${escapeHtml(a.name)}</a></li>`).join("")}</ul>`
    : "";

  const adminResult = await sendEmail({
    to: "info@rsvp-duhuze.com",
    subject: `[Support] ${category} - from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="margin-bottom: 4px;">New support request</h2>
        <p style="color: #666; margin-top: 0;">From the ${escapeHtml(EMAIL_BRAND_NAME)} website</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Category:</strong> ${escapeHtml(category)}</p>
        ${eventLine}
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="white-space: pre-line;">${escapeHtml(message)}</p>
        ${attachmentsHtml}
      </div>
    `,
  });

  if (!adminResult.ok) return { success: false, error: "Failed to submit request. Please try again later." };

  await sendEmail({
    to: email,
    subject: `We received your support request - ${EMAIL_BRAND_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="margin-bottom: 4px;">We got your message, ${escapeHtml(name)}!</h2>
        <p style="color: #666; margin-top: 0;">The ${escapeHtml(EMAIL_BRAND_NAME)} team</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p>We've received your support request about <strong>${escapeHtml(category)}</strong> and will get back to you as soon as possible.</p>
        <blockquote style="border-left: 3px solid #eee; padding-left: 12px; color: #555; white-space: pre-line;">${escapeHtml(message)}</blockquote>
        <p style="color: #999; font-size: 13px;">You're receiving this because you submitted a support request on ${escapeHtml(EMAIL_BRAND_NAME)}.</p>
      </div>
    `,
  });

  return { success: true };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
