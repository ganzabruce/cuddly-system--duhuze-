import type { NotificationChannel, NotificationRecipient, NotificationType } from "@/types/notifications";

const RSVP_TYPES: NotificationType[] = ["rsvp_received", "rsvp_updated"];
const REMINDER_TYPES: NotificationType[] = ["reminders_sent"];

export function isChannelEnabledForRecipient(
  channel: NotificationChannel,
  type: NotificationType,
  recipient: NotificationRecipient,
): boolean {
  const notifications = recipient.preferences.notifications;

  if (channel === "in_app") {
    return true;
  }

  if (channel === "email") {
    if (!notifications.email) return false;
    if (RSVP_TYPES.includes(type)) return notifications.rsvpUpdates;
    if (REMINDER_TYPES.includes(type)) return notifications.eventReminders;
    return true;
  }

  if (channel === "push") {
    if (!notifications.push) return false;
    if (RSVP_TYPES.includes(type)) return notifications.rsvpUpdates;
    if (REMINDER_TYPES.includes(type)) return notifications.eventReminders;
    return true;
  }

  if (channel === "whatsapp") {
    if (!notifications.whatsapp) return false;
    if (!recipient.whatsappPhoneNumber || !recipient.whatsappConsentAt) return false;
    if (RSVP_TYPES.includes(type)) return notifications.rsvpUpdates;
    if (REMINDER_TYPES.includes(type)) return notifications.eventReminders;
    return true;
  }

  return false;
}
