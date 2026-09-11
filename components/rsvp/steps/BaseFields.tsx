"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type {
  AdditionalGuestDraft,
  AttendeeCategory,
} from "@/types/events";

type FormErrors = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  rsvpStatus?: string;
  rsvpNote?: string;
  additionalGuestCount?: string;
};

export interface BaseFieldsHandle {
  validate: () => boolean;
}

export interface BaseFieldsProps {
  nameValue: string;
  emailValue: string;
  phoneValue: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  additionalGuestCount: number;
  onAdditionalGuestCountChange: (count: number) => void;
  additionalGuestDrafts: AdditionalGuestDraft[];
  onAdditionalGuestDraftChange: (
    index: number,
    field: keyof AdditionalGuestDraft,
    value: string,
  ) => void;
  attendeeCategories: AttendeeCategory[];
  allowAdditionalGuests: boolean;
  maxAdditionalGuests: number;
  rsvpNote: string;
  errors?: FormErrors;
  atCapacity: boolean;
}

export const BaseFields = forwardRef<BaseFieldsHandle, BaseFieldsProps>(function BaseFields({
  nameValue,
  emailValue,
  phoneValue,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  selectedStatus,
  onStatusChange,
  additionalGuestCount,
  onAdditionalGuestCountChange,
  additionalGuestDrafts,
  onAdditionalGuestDraftChange,
  attendeeCategories,
  allowAdditionalGuests,
  maxAdditionalGuests,
  rsvpNote,
  errors,
  atCapacity,
}: BaseFieldsProps, ref: React.Ref<BaseFieldsHandle>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bringingGuests, setBringingGuests] = useState(additionalGuestCount > 0);
  const showAdditionalGuests =
    allowAdditionalGuests && selectedStatus === "yes" && !atCapacity;

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!selectedStatus) return false;
      if (!containerRef.current) return true;
      const controls = containerRef.current.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea");
      for (const control of controls) {
        if (control.disabled || control.type === "radio" || control.reportValidity()) continue;
        return false;
      }
      return true;
    },
  }));

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Guest info */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          Your Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Type your full name..."
          required
          className="h-11"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          aria-invalid={errors?.name ? "true" : "false"}
        />
        {errors?.name ? (
          <p className="text-sm text-destructive">{errors.name}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address {!phoneValue.trim() ? <span className="text-destructive">*</span> : null}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required={!phoneValue.trim()}
          className="h-11"
          value={emailValue}
          onChange={(e) => onEmailChange(e.target.value)}
          aria-invalid={errors?.email ? "true" : "false"}
        />
        {errors?.email ? (
          <p className="text-sm text-destructive">{errors.email}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
          Phone Number {!emailValue.trim() ? <span className="text-destructive">*</span> : null}
        </Label>
        <PhoneInput
          id="phoneNumber"
          name="phoneNumber"
          defaultValue={phoneValue}
          onChange={onPhoneChange}
          error={Boolean(errors?.phoneNumber)}
        />
        <p className="text-xs text-muted-foreground">
          Please provide at least an email or phone number.
        </p>
        {errors?.phoneNumber ? (
          <p className="text-sm text-destructive">{errors.phoneNumber}</p>
        ) : null}
      </div>

      {/* Response */}
      {atCapacity ? (
        <p className="font-medium text-warning-deep">
          This event has reached its capacity. You can still submit No or Maybe.
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="rsvpStatus" className="text-sm font-medium text-foreground">
          Your response <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(["yes", "no", "maybe"] as const).map((value) => (
            <label
              key={value}
              className={
                value === "yes" && atCapacity
                  ? "relative flex cursor-not-allowed opacity-60"
                  : "relative flex cursor-pointer"
              }
            >
              <input
                type="radio"
                name="rsvpStatus"
                value={value}
                className="peer sr-only"
                disabled={value === "yes" && atCapacity}
                checked={selectedStatus === value}
                onChange={() => onStatusChange(value)}
              />
              <div className="flex h-11 w-full items-center justify-center rounded-md border-2 border-input bg-background text-sm font-medium text-foreground transition-all hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                {value === "maybe" ? "Maybe" : value === "yes" ? "Yes" : "No"}
              </div>
            </label>
          ))}
        </div>
        {errors?.rsvpStatus ? (
          <p className="text-sm text-destructive">
            {errors.rsvpStatus}
          </p>
        ) : null}
      </div>

      {/* Additional guests */}
      {showAdditionalGuests ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Bringing additional guests?
            </Label>
            <Switch
              checked={bringingGuests}
              onCheckedChange={(checked) => {
                setBringingGuests(checked);
                if (checked && additionalGuestCount === 0) onAdditionalGuestCountChange(1);
                if (!checked) onAdditionalGuestCountChange(0);
              }}
            />
          </div>

          {bringingGuests ? (
            <div className="space-y-2">
              <Label htmlFor="additionalGuestCount" className="text-sm font-medium text-foreground">
                How many additional guests?
              </Label>
              <Input
                id="additionalGuestCount"
                name="additionalGuestCount"
                type="number"
                min={1}
                max={maxAdditionalGuests}
                value={additionalGuestCount || 1}
                className="h-11"
                onChange={(e) =>
                  onAdditionalGuestCountChange(
                    Math.max(
                      1,
                      Math.min(maxAdditionalGuests, Number(e.currentTarget.value) || 1),
                    ),
                  )}
              />
              {errors?.additionalGuestCount ? (
                <p className="text-sm text-destructive">
                  {errors.additionalGuestCount}
                </p>
              ) : null}
            </div>
          ) : null}

          {additionalGuestCount > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Share each additional guest&apos;s details so the
                organizer can review the full RSVP clearly.
              </p>
              {Array.from({ length: additionalGuestCount }, (_, index) => (
                <div
                  key={`additional-guest-${index}`}
                  className="space-y-3 rounded-md border border-border bg-muted/30 p-3"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Additional guest {index + 1}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`additionalGuest_${index}_name`}
                        className="text-xs font-medium text-foreground"
                      >
                        Name
                      </Label>
                      <Input
                        id={`additionalGuest_${index}_name`}
                        name={`additionalGuest_${index}_name`}
                        type="text"
                        placeholder="Full name"
                        className="h-9"
                        value={additionalGuestDrafts[index]?.name ?? ""}
                        onChange={(event) =>
                          onAdditionalGuestDraftChange(
                            index,
                            "name",
                            event.currentTarget.value,
                          )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`additionalGuest_${index}_email`}
                        className="text-xs font-medium text-foreground"
                      >
                        Email
                      </Label>
                      <Input
                        id={`additionalGuest_${index}_email`}
                        name={`additionalGuest_${index}_email`}
                        type="email"
                        placeholder="email@example.com"
                        className="h-9"
                        value={additionalGuestDrafts[index]?.email ?? ""}
                        onChange={(event) =>
                          onAdditionalGuestDraftChange(
                            index,
                            "email",
                            event.currentTarget.value,
                          )}
                      />
                    </div>
                    {attendeeCategories.length > 0 ? (
                      <div className="space-y-1 sm:col-span-2">
                        <Label
                          htmlFor={`additionalGuest_${index}_categoryId`}
                          className="text-xs font-medium text-foreground"
                        >
                          Category
                        </Label>
                        <select
                          id={`additionalGuest_${index}_categoryId`}
                          name={`additionalGuest_${index}_categoryId`}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                          value={additionalGuestDrafts[index]?.categoryId ?? ""}
                          onChange={(event) =>
                            onAdditionalGuestDraftChange(
                              index,
                              "categoryId",
                              event.currentTarget.value,
                            )}
                        >
                          {attendeeCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="rsvpNote" className="text-sm font-medium text-foreground">
          Additional Notes (Optional)
        </Label>
        <RichTextEditor
          name="rsvpNote"
          defaultValue={rsvpNote}
          placeholder="Dietary restrictions, special requests, or context for the organizer."
          showToolbar={false}
          minHeight="96px"
        />
        {errors?.rsvpNote ? (
          <p className="text-sm text-destructive">{errors.rsvpNote}</p>
        ) : null}
      </div>
    </div>
  );
});
