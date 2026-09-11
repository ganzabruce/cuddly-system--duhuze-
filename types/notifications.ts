import type { UserPreferences } from "@/types/auth";

export const notificationTypes = [
  "event_created",
  "event_updated",
  "guest_added",
  "guests_imported",
  "invitations_sent",
  "reminders_sent",
  "rsvp_received",
  "rsvp_updated",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const notificationChannels = [
  "in_app",
  "email",
  "push",
  "sms",
  "whatsapp",
] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export type NotificationContext = {
  eventId?: number;
  eventSlug?: string | null;
  eventTitle?: string | null;
  guestId?: number;
  guestName?: string | null;
  guestEmail?: string | null;
  rsvpStatus?: "yes" | "no" | "maybe";
  additionalGuestCount?: number;
  count?: number;
  changes?: string[];
  link?: string | null;
  [key: string]: unknown;
};

export interface PublishNotificationInput {
  type: NotificationType;
  recipientUserIds: number[];
  actorUserId?: number | null;
  context?: NotificationContext;
}

export interface NotificationContent {
  title: string;
  body: string;
  link: string | null;
  payload?: Record<string, unknown> | null;
}

export interface NotificationDefinition {
  channels: NotificationChannel[];
  buildContent: (context: NotificationContext) => NotificationContent;
}

export interface NotificationRecipient {
  userId: number;
  email: string;
  name: string | null;
  preferences: UserPreferences;
  whatsappPhoneNumber: string | null;
  whatsappConsentAt: string | null;
}

export interface ResolvedNotification {
  type: NotificationType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  content: NotificationContent;
  context: NotificationContext;
  actorUserId: number | null;
}

export interface ChannelResult {
  channel: NotificationChannel;
  status: "sent" | "skipped" | "failed";
  error?: string;
}

export interface ChannelHandler {
  send: (input: ResolvedNotification) => Promise<ChannelResult>;
}

export type NotificationFilter = "all" | "unread" | "read";

export interface NotificationInboxItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface NotificationCounts {
  all: number;
  unread: number;
  read: number;
}
