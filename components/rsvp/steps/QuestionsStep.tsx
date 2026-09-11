"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_TEXTAREA_ANSWER_LENGTH } from "@/lib/constants/events/rsvp-limits";
import type { CustomRsvpQuestion } from "@/types/events";

export interface QuestionsStepHandle {
  validate: () => boolean;
}

export interface QuestionsStepProps {
  customQuestions: CustomRsvpQuestion[];
  serverErrors?: { customQuestions?: string };
}

function QuestionYesNoField({
  id,
  required,
  onInteraction,
}: {
  id: string;
  required: boolean;
  onInteraction: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(["yes", "no"] as const).map((value) => (
        <label key={`${id}-${value}`} className="relative flex cursor-pointer">
          <input
            id={`${id}-${value}`}
            type="radio"
            name={`cq_${id}`}
            value={value}
            className="peer sr-only"
            required={required}
            onChange={onInteraction}
          />
          <div className="flex h-11 w-full items-center justify-center rounded-md border-2 border-input bg-background text-sm font-medium text-foreground transition-all hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
            {value === "yes" ? "Yes" : "No"}
          </div>
        </label>
      ))}
    </div>
  );
}

function QuestionMultiselectField({
  question,
  error,
  onInteraction,
}: {
  question: CustomRsvpQuestion;
  error?: string;
  onInteraction: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={`cq_${question.id}`}
        value={JSON.stringify(selected)}
      />
      {(question.options ?? []).map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={`${question.id}-${option}`}
            className="flex items-center gap-3 rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => {
                onInteraction();
                setSelected((current) =>
                  event.target.checked
                    ? [...current, option]
                    : current.filter((item) => item !== option),
                );
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export const QuestionsStep = forwardRef<QuestionsStepHandle, QuestionsStepProps>(
  function QuestionsStep({ customQuestions, serverErrors }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const clearError = (questionId: string) => {
      setClientErrors((current) => {
        if (!(questionId in current)) return current;
        const next = { ...current };
        delete next[questionId];
        return next;
      });
    };

    useImperativeHandle(ref, () => ({
      validate: () => {
        const formEl = containerRef.current?.closest("form");
        if (!formEl) return true;
        const formData = new FormData(formEl);
        const errors: Record<string, string> = {};

        for (const question of customQuestions) {
          if (!question.required) continue;

          const type = question.type ?? "text";
          const rawValue = formData.get(`cq_${question.id}`);
          const value = typeof rawValue === "string" ? rawValue.trim() : "";

          if (type === "multiselect") {
            try {
              const parsed = JSON.parse(value || "[]");
              if (!Array.isArray(parsed) || parsed.length === 0) {
                errors[question.id] = "This field is required";
              }
            } catch {
              errors[question.id] = "This field is required";
            }
            continue;
          }

          if (value.length === 0) {
            errors[question.id] = "This field is required";
          }
        }

        setClientErrors(errors);
        return Object.keys(errors).length === 0;
      },
    }));

    return (
      <div ref={containerRef} className="space-y-6">
        {customQuestions.map((question) => {
          const type = question.type ?? "text";

          return (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={`cq_${question.id}`} className="text-sm font-medium text-foreground">
                {question.label}
                {question.required ? (
                  <span className="ml-1 text-destructive">*</span>
                ) : null}
              </Label>

              {type === "textarea" ? (
                <Textarea
                  id={`cq_${question.id}`}
                  name={`cq_${question.id}`}
                  required={question.required}
                  maxLength={MAX_TEXTAREA_ANSWER_LENGTH}
                  rows={5}
                  placeholder="Your answer..."
                  onChange={() => clearError(question.id)}
                />
              ) : null}

              {type === "yesno" ? (
                <QuestionYesNoField
                  id={question.id}
                  required={question.required}
                  onInteraction={() => clearError(question.id)}
                />
              ) : null}

              {type === "select" ? (
                <select
                  id={`cq_${question.id}`}
                  name={`cq_${question.id}`}
                  required={question.required}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  defaultValue=""
                  onChange={() => clearError(question.id)}
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  {(question.options ?? []).map((option) => (
                    <option key={`${question.id}-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}

              {type === "multiselect" ? (
                <QuestionMultiselectField
                  question={question}
                  error={clientErrors[question.id]}
                  onInteraction={() => clearError(question.id)}
                />
              ) : null}

              {type === "text" ? (
                <Input
                  id={`cq_${question.id}`}
                  name={`cq_${question.id}`}
                  type="text"
                  required={question.required}
                  maxLength={1000}
                  className="h-11"
                  placeholder="Your answer..."
                  onChange={() => clearError(question.id)}
                />
              ) : null}

              {type !== "multiselect" && clientErrors[question.id] ? (
                <p className="text-sm text-destructive">
                  {clientErrors[question.id]}
                </p>
              ) : null}
            </div>
          );
        })}

        {serverErrors?.customQuestions ? (
          <p className="text-sm text-destructive">
            {serverErrors.customQuestions}
          </p>
        ) : null}
      </div>
    );
  },
);
