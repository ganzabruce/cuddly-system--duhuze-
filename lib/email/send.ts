import { Resend } from "resend";
import { withRetry } from "@/lib/utils/retry";
import { env } from "@/lib/env";
import { EMAIL_BRAND_NAME } from "@/lib/constants/brand";
import { inviteEmailHtml } from "@/lib/services/notifications/templates/InviteEmail";
import { reminderEmailHtml } from "@/lib/services/notifications/templates/ReminderEmail";
import { rsvpConfirmationEmailHtml } from "@/lib/services/notifications/templates/RsvpConfirmationEmail";
import { rsvpUpdateEmailHtml } from "@/lib/services/notifications/templates/RsvpUpdateEmail";
import { adminInviteEmailHtml } from "@/lib/services/notifications/templates/AdminInviteEmail";
import { adminPasswordResetEmailHtml } from "@/lib/services/notifications/templates/AdminPasswordResetEmail";
import {
    organizerNotificationEmailHtml,
    organizerNotificationSubject,
} from "@/lib/services/notifications/templates/OrganizerNotificationEmail";
import type {
    EventEmailBase,
    EventInviteContent,
    RsvpConfirmationContent,
    RsvpStatusLabel,
    RsvpUpdateContent,
    OrganizerNotificationContent,
} from "./types";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const DEFAULT_FROM_ADDRESS = "noreply@rsvp-duhuze.com";

function buildFromEmail(configuredFromEmail?: string): string {
    const emailMatch = configuredFromEmail?.match(
        /<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i,
    );
    const address = emailMatch?.[1] ?? DEFAULT_FROM_ADDRESS;
    return `${EMAIL_BRAND_NAME} <${address}>`;
}

const FROM_EMAIL = buildFromEmail(env.RESEND_FROM_EMAIL);

/** Strip newlines from email subjects to prevent header injection. */
function sanitizeSubject(s: string): string {
    return s.replace(/[\r\n]+/g, " ").trim();
}

export type SendEmailResult = { ok: boolean; error?: string };

export type {
    EventEmailBase,
    EventInviteContent,
    RsvpConfirmationContent,
    RsvpStatusLabel,
    RsvpUpdateContent,
    OrganizerNotificationContent,
};

export interface EmailAttachment {
    filename: string;
    content: Buffer;
    content_type?: string;
    headers?: Record<string, string>;
}

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
}

export async function sendEmail(
    params: SendEmailParams,
): Promise<SendEmailResult> {
    if (!resend) {
        return { ok: false, error: "RESEND_API_KEY is not configured" };
    }
    try {
        const { error } = await withRetry(() =>
            resend!.emails.send({
                from: FROM_EMAIL,
                to: [params.to],
                subject: params.subject,
                html: params.html,
                ...(params.attachments?.length && { attachments: params.attachments }),
            }),
        );
        if (error) return { ok: false, error: error.message };
        return { ok: true };
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to send email";
        return { ok: false, error: message };
    }
}

export interface SendEmailsResult {
    ok: boolean;
    sentCount: number;
    failedCount: number;
    errors?: Array<{ index: number; message: string }>;
    error?: string;
}

/** Send multiple emails in one batch (e.g. bulk reminders). */
export async function sendEmails(
    emails: SendEmailParams[],
    options?: { batchValidation?: "strict" | "permissive" },
): Promise<SendEmailsResult> {
    if (!resend) {
        return {
            ok: false,
            sentCount: 0,
            failedCount: emails.length,
            error: "RESEND_API_KEY is not configured",
        };
    }
    if (emails.length === 0) {
        return { ok: true, sentCount: 0, failedCount: 0 };
    }
    try {
        const payload = emails.map((e) => ({
            from: FROM_EMAIL,
            to: [e.to],
            subject: e.subject,
            html: e.html,
            ...(e.attachments?.length && { attachments: e.attachments }),
        }));
        const { data, error } = await resend.batch.send(payload, {
            batchValidation: options?.batchValidation ?? "permissive",
        });
        if (error) {
            return {
                ok: false,
                sentCount: 0,
                failedCount: emails.length,
                error: error.message,
            };
        }
        const ids = data?.data ?? [];
        const sentCount = ids.length;
        const failedCount = emails.length - sentCount;
        // Resend batch processes in order; if fewer IDs returned, later emails likely failed
        const errors = failedCount > 0
            ? Array.from({ length: failedCount }, (_, i) => ({
                  index: sentCount + i,
                  message: "Email delivery not confirmed by provider",
              }))
            : [];
        return {
            ok: failedCount === 0,
            sentCount,
            failedCount,
            ...(errors.length > 0 && { errors }),
        };
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to send emails";
        return {
            ok: false,
            sentCount: 0,
            failedCount: emails.length,
            error: message,
        };
    }
}

export type SendInviteEmailParams = { to: string } & EventInviteContent;

export async function sendInviteEmail(
    params: SendInviteEmailParams,
): Promise<SendEmailResult> {
    const { to, ...content } = params;
    const html = inviteEmailHtml(content);
    return sendEmail({
        to,
        subject: sanitizeSubject(`You're invited: ${params.eventTitle}`),
        html,
    });
}

export type SendReminderEmailParams = { to: string } & EventInviteContent;

export async function sendReminderEmail(
    params: SendReminderEmailParams,
): Promise<SendEmailResult> {
    const { to, ...content } = params;
    const html = reminderEmailHtml(content);
    return sendEmail({
        to,
        subject: sanitizeSubject(`Reminder: RSVP for ${params.eventTitle}`),
        html,
    });
}

/** Bulk send reminder emails (e.g. many guests at once). */
export async function sendReminderEmails(
    params: SendReminderEmailParams[],
    options?: { batchValidation?: "strict" | "permissive" },
): Promise<SendEmailsResult> {
    if (params.length === 0) {
        return { ok: true, sentCount: 0, failedCount: 0 };
    }
    const emails: SendEmailParams[] = params.map((p) => {
        const { to, ...content } = p;
        const html = reminderEmailHtml(content);
        return {
            to,
            subject: `Reminder: RSVP for ${p.eventTitle}`,
            html,
        };
    });
    return sendEmails(emails, options);
}

export type SendRsvpConfirmationEmailParams = {
    to: string;
} & RsvpConfirmationContent;

function getRsvpConfirmationSubject(
    eventTitle: string,
    rsvpStatus: RsvpConfirmationContent["rsvpStatus"],
): string {
    switch (rsvpStatus) {
        case "yes":
            return sanitizeSubject(`You're attending: ${eventTitle}`);
        case "no":
            return sanitizeSubject(`Can't attend: ${eventTitle}`);
        case "maybe":
            return sanitizeSubject(`Maybe attending: ${eventTitle}`);
    }
}

function getRsvpUpdateSubject(
    eventTitle: string,
    rsvpStatus: RsvpUpdateContent["rsvpStatus"],
): string {
    switch (rsvpStatus) {
        case "yes":
            return sanitizeSubject(`RSVP updated: attending ${eventTitle}`);
        case "no":
            return sanitizeSubject(`RSVP updated: can't attend ${eventTitle}`);
        case "maybe":
            return sanitizeSubject(`RSVP updated: maybe attending ${eventTitle}`);
    }
}

export async function sendAdminInviteEmail(params: {
    to: string;
    inviteLink: string;
    inviterName: string;
    role: string;
}): Promise<SendEmailResult> {
    const html = adminInviteEmailHtml({
        inviteLink: params.inviteLink,
        inviterName: params.inviterName,
        role: params.role,
    });
    return sendEmail({
        to: params.to,
        subject: `You've been invited to join ${EMAIL_BRAND_NAME} as an admin`,
        html,
    });
}

export async function sendAdminPasswordResetEmail(params: {
    to: string;
    resetLink: string;
}): Promise<SendEmailResult> {
    const html = adminPasswordResetEmailHtml({
        resetLink: params.resetLink,
    });
    return sendEmail({
        to: params.to,
        subject: `Reset your ${EMAIL_BRAND_NAME} admin password`,
        html,
    });
}

export async function sendRsvpConfirmationEmail(
    params: SendRsvpConfirmationEmailParams,
): Promise<SendEmailResult> {
    const { to, ...content } = params;
    const html = rsvpConfirmationEmailHtml(content);
    return sendEmail({
        to,
        subject: getRsvpConfirmationSubject(
            params.eventTitle,
            params.rsvpStatus,
        ),
        html,
    });
}

export type SendRsvpUpdateEmailParams = {
    to: string;
} & RsvpUpdateContent;

export async function sendRsvpUpdateEmail(
    params: SendRsvpUpdateEmailParams,
): Promise<SendEmailResult> {
    const { to, ...content } = params;
    const html = rsvpUpdateEmailHtml(content);
    return sendEmail({
        to,
        subject: getRsvpUpdateSubject(params.eventTitle, params.rsvpStatus),
        html,
    });
}

export type SendOrganizerNotificationEmailParams = {
    to: string;
} & OrganizerNotificationContent;

export async function sendOrganizerNotificationEmail(
    params: SendOrganizerNotificationEmailParams,
): Promise<SendEmailResult> {
    const { to, ...content } = params;
    const html = organizerNotificationEmailHtml(content);
    const subject = organizerNotificationSubject(content);
    return sendEmail({ to, subject, html });
}
