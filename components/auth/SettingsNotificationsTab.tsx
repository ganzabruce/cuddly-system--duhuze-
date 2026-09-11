"use client";

import { useState, useTransition } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { updateNotificationsAction } from "@/actions/auth/actions";
import type { NotificationsPreferences, UserSettings } from "@/types/auth";
import { toast } from "sonner";
import { switchRowClass } from "@/components/auth/settingsStyles";

const NOTIFICATION_OPTIONS: Array<{
    key: keyof NotificationsPreferences;
    label: string;
    description: string;
}> = [
    { key: "email", label: "Email notifications", description: "Receive updates by email" },
    { key: "push", label: "Push notifications", description: "Browser and device alerts" },
    { key: "whatsapp", label: "WhatsApp notifications", description: "Private WhatsApp alerts for organizer updates" },
    { key: "rsvpUpdates", label: "RSVP updates", description: "When guests respond to your events" },
    { key: "eventReminders", label: "Event reminders", description: "Get reminded before your events" },
    { key: "marketingUpdates", label: "Marketing & offers", description: "News and offers from the team" },
];

export const NOTIFICATIONS_TAB_CONFIG = {
    value: "notifications",
    label: "Notifications",
    Icon: BellIcon,
} as const;

type SettingsNotificationsTabProps = {
    initialSettings: UserSettings | null;
};

export function SettingsNotificationsTab({ initialSettings }: SettingsNotificationsTabProps) {
    const defaultNotifications = initialSettings?.preferences?.notifications ?? {
        email: true,
        push: true,
        whatsapp: true,
        rsvpUpdates: true,
        eventReminders: true,
        marketingUpdates: false,
    };
    const [notifications, setNotifications] =
        useState<NotificationsPreferences>(defaultNotifications);
    const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState(
        initialSettings?.whatsappPhoneNumber ?? "",
    );
    const [whatsappConsent, setWhatsappConsent] = useState(
        Boolean(initialSettings?.whatsappConsentAt),
    );
    const [isSavingNotif, startNotifTransition] = useTransition();

    const saveNotifications = () => {
        startNotifTransition(async () => {
            const result = await updateNotificationsAction({
                notifications,
                whatsappPhoneNumber: whatsappPhoneNumber.trim() || null,
                whatsappConsent,
            });
            if (result.success) toast.success("Notification preferences saved");
            else toast.error(result.error);
        });
    };

    return (
        <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <h2 className="m-0 text-base font-semibold text-foreground">Notifications</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Choose how you want to be notified
                </p>
            </div>
            <div className="px-4 py-4">
                <div className="mb-4 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    In-app notification inbox is always enabled. These toggles control email,
                    push, and private WhatsApp delivery.
                </div>
                <div className="mb-4 rounded-md border border-border bg-background px-3 py-3">
                    <div className="space-y-1">
                        <Label htmlFor="whatsappPhoneNumber" className="text-sm font-medium">
                            Private WhatsApp number
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            This number is used only for organizer alerts and is not shown on
                            your public profile.
                        </p>
                    </div>
                    <div className="mt-3 space-y-3">
                        <PhoneInput
                            id="whatsappPhoneNumber"
                            defaultValue={whatsappPhoneNumber}
                            onChange={setWhatsappPhoneNumber}
                        />
                        <label className="flex items-start gap-3">
                            <Checkbox
                                checked={whatsappConsent}
                                onCheckedChange={(checked) =>
                                    setWhatsappConsent(checked === true)
                                }
                            />
                            <span className="text-xs text-muted-foreground">
                                I consent to receive organizer notifications on this WhatsApp
                                number.
                            </span>
                        </label>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {NOTIFICATION_OPTIONS.map(({ key, label, description }) => (
                        <div key={key} className={switchRowClass}>
                            <div className="flex items-center gap-3">
                                <div>
                                    <Label className="text-sm font-medium">{label}</Label>
                                    <p className="text-xs text-muted-foreground">{description}</p>
                                </div>
                            </div>
                            <Switch
                                checked={notifications[key]}
                                onCheckedChange={(checked) =>
                                    setNotifications((prev) => ({
                                        ...prev,
                                        [key]: checked,
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end border-t border-border px-4 py-3">
                <Button onClick={saveNotifications} disabled={isSavingNotif} size="sm">
                    {isSavingNotif ? "Saving…" : "Save notifications"}
                </Button>
            </div>
        </div>
    );
}
