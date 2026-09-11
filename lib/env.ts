import { z } from "zod";

/** Client-safe: only NEXT_PUBLIC_* vars. Use in "use client" components. */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

/** Server env: includes secrets and backend-only config. */
const envSchema = z.object({
  DATABASE_URL: z.url().min(1),
  DATABASE_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  DATABASE_FETCH_MAX_RETRIES: z.coerce.number().int().positive().optional(),
  DATABASE_FETCH_RETRY_DELAY_MS: z.coerce.number().int().nonnegative().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_WHATSAPP_NOTIFY_TEMPLATE_SID: z.string().optional(),
  TWILIO_WHATSAPP_INVITE_TEMPLATE_SID: z.string().optional(),
  TWILIO_WHATSAPP_RESPONSE_TEMPLATE_SID: z.string().optional(),
  EMAIL_QR_SIGNING_SECRET: z.string().optional(),
  UPLOADTHING_KEY: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  APP_BASE_URL: z.url(),
  INTOUCH_BASE_URL: z.string().url().optional(),
  INTOUCH_USERNAME: z.string().optional(),
  INTOUCH_ACCOUNT_NO: z.string().optional(),
  INTOUCH_PARTNER_PASSWORD: z.string().optional(),
  INTOUCH_CALLBACK_USERNAME: z.string().optional(),
  INTOUCH_CALLBACK_PASSWORD: z.string().optional(),
  PESAPAL_BASE_URL: z.string().url().optional(),
  PESAPAL_CONSUMER_KEY: z.string().optional(),
  PESAPAL_CONSUMER_SECRET: z.string().optional(),
  PESAPAL_NOTIFICATION_ID: z.string().optional(),
});

export const clientEnv = clientEnvSchema.parse(process.env);
export const env =
  typeof window === "undefined"
    ? envSchema.parse(process.env)
    : (clientEnv as unknown as z.infer<typeof envSchema>);

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export type Env = z.infer<typeof envSchema>;
