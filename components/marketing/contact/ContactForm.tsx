"use client";

import { useActionState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { submitContactForm } from "@/actions/marketing/actions";
import type { FormState } from "@/types/marketing";
import {
  CONTACT_SUBJECTS,
  type ContactSubject,
} from "@/components/marketing/contact-content";

const initialState: FormState = { success: false };

type ContactFormProps = {
  initialSubject?: ContactSubject | "";
};

export function ContactForm({ initialSubject = "" }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("contact");

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction}>
      {state.success && (
        <div className="mb-6 rounded-md border border-success/30 bg-success/6 px-4 py-3 text-sm text-success">
          {t("form.success")}
        </div>
      )}

      {state.error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/6 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-foreground"
          >
            {t("form.nameLabel")}
          </label>
          <div className="mt-2">
            <Input
              id="name"
              name="name"
              placeholder={t("form.namePlaceholder")}
              required
              minLength={2}
            />
          </div>
          {state.fieldErrors?.name && (
            <p className="mt-1.5 text-xs text-destructive">
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-foreground"
          >
            {t("form.emailLabel")}
          </label>
          <div className="mt-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("form.emailPlaceholder")}
              required
            />
          </div>
          {state.fieldErrors?.email && (
            <p className="mt-1.5 text-xs text-destructive">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        {/* Subject */}
        <div className="sm:col-span-2">
          <label
            htmlFor="subject"
            className="block text-sm font-semibold text-foreground"
          >
            {t("form.subjectLabel")}
          </label>
          <div className="mt-2">
            <select
              id="subject"
              name="subject"
              required
              defaultValue={initialSubject}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground hover:border-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                {t("form.subjectPlaceholder")}
              </option>
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          {state.fieldErrors?.subject && (
            <p className="mt-1.5 text-xs text-destructive">
              {state.fieldErrors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-foreground"
          >
            {t("form.messageLabel")}
          </label>
          <div className="mt-2">
            <Textarea
              id="message"
              name="message"
              placeholder={t("form.messagePlaceholder")}
              required
              minLength={10}
              rows={5}
            />
          </div>
          {state.fieldErrors?.message && (
            <p className="mt-1.5 text-xs text-destructive">
              {state.fieldErrors.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Button
          variant="default"
          size="lg"
          disabled={pending}
          className="w-full"
        >
          {pending ? t("form.sending") : t("form.send")}
        </Button>
      </div>
    </form>
  );
}
