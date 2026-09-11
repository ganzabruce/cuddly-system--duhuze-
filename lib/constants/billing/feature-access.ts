import type { PlanFeatureFlags } from "@/types/billing";

export type BillingFeatureAccess = Pick<
  PlanFeatureFlags,
  | "advancedEventSettings"
  | "csvImport"
  | "csvExport"
  | "customQuestions"
  | "eventContributions"
  | "attendeeCategories"
  | "analytics"
  | "whatsappInvitations"
>;
