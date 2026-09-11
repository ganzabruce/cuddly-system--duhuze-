import { announcements } from "@/lib/db/schema";
import type { PaymentRow } from "@/types/billing";

// ── Users ──
export interface UserWithStats {
  id: number;
  name: string;
  email: string;
  username: string | null;
  status: string;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  createdAt: Date | null;
  eventsCount: number;
}

export type UserLocation = { country?: string; city?: { name?: string } } | null;
export type UserPreferences = Record<string, unknown> | null;

export interface AdminUserDetail extends UserWithStats {
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  publicEmail: string | null;
  phoneNumber: string | null;
  tagline: string | null;
  bio: string | null;
  websiteUrl: string | null;
  socials: unknown;
  location: UserLocation;
  preferredCurrency: string | null;
  timezone: string | null;
  preferences: UserPreferences;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ok" | "suspended";
}

export interface UserListResult {
  users: UserWithStats[];
  total: number;
  page: number;
  limit: number;
}

// ── Events ──
export type EventWithStats = {
  id: number;
  slug: string;
  username: string;
  title: string;
  category: string | null;
  date: Date;
  visibility: string;
  organizerName: string;
  organizerUsername: string | null;
  organizerEmail: string;
  guestCount: number;
  createdAt: Date | null;
};

export type EventIdentifier = {
  username: string;
  slug: string;
};

export type EventListParams = {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: "public" | "private";
  filter?: "upcoming" | "past";
};

export type EventListResult = {
  events: EventWithStats[];
  total: number;
  page: number;
  limit: number;
};

// ── Platform stats ──
export interface PlatformStats {
  totalUsers: number;
  totalEvents: number;
  totalRSVPs: number;
  recentSignups: Array<{
    id: number;
    name: string;
    email: string;
    username: string | null;
    createdAt: Date;
  }>;
  recentEvents: Array<{
    id: number;
    slug: string;
    username: string;
    title: string;
    date: Date;
    visibility: string;
    organizerName: string;
    organizerUsername: string | null;
    createdAt: Date;
  }>;
}

export type PlatformBillingStats = {
  totalActiveSubscriptions: number;
  totalInGracePeriod: number;
  byPlan: { standard: number; premium: number };
  fromPromotion: number;
  recentPayments: PaymentRow[];
};

// ── Admin directory ──
export type AdminRole = "owner" | "admin";

export type AdminMember = {
  id: number;
  userId: number | null;
  email: string;
  name: string;
  role: AdminRole;
  status: "active" | "disabled";
  createdBy: number | null;
  createdAt: Date;
};

// ── Audit log ──
export interface AuditLogEntry {
  id: number;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// ── Announcements ──
export type AnnouncementRow = typeof announcements.$inferSelect;

export type ActiveAnnouncement = {
  id: number;
  message: string;
  linkText: string | null;
  linkHref: string | null;
  variant: "default" | "accent" | "destructive";
};

// ── Health checks ──
export type ServiceStatus = "healthy" | "degraded" | "down" | "not_configured";

export interface ServiceCheckResult {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: Date;
}

export interface HealthCheckResult {
  services: ServiceCheckResult[];
  checkedAt: Date;
}

export type OverallHealthStatus = "healthy" | "degraded" | "down";

export interface SerializedServiceCheckResult extends Omit<ServiceCheckResult, "lastChecked"> {
  lastChecked: string;
}

export interface SerializedHealthCheckResult extends Omit<HealthCheckResult, "checkedAt" | "services"> {
  checkedAt: string;
  services: SerializedServiceCheckResult[];
}

/** An admin user with role, from the admin_users table. */
export type AdminUser = {
  id: number;
  userId: number;
  email: string;
  name: string;
  role: "owner" | "admin";
};

/** One row in the application error log. */
export interface ErrorLogEntry {
  id: number;
  level: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown> | null;
  source: string | null;
  userId: number | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
}

/** Filters and pagination for querying the error log. */
export interface ErrorLogParams {
  page?: number;
  limit?: number;
  level?: "warn" | "error";
  source?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
}

/** A page of error-log entries. */
export interface ErrorLogResult {
  entries: ErrorLogEntry[];
  total: number;
  page: number;
  limit: number;
}

/** Result of initiating a test payment (admin tooling). */
export type TestPaymentResult = {
  paymentId: number;
  status: string;
  providerTransactionId: string | null;
  redirectUrl: string | null;
  rawResponse: unknown;
};

/** Result of checking a test payment's status (admin tooling). */
export type CheckResult = {
  status: string;
  rawResponse: unknown;
};
