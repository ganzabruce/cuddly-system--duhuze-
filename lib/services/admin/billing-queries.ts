import db from "@/lib/db";
import { subscriptions, payments } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { PaymentRow } from "@/types/billing";
import type { PlatformBillingStats } from "@/types/admin";

export async function getPlatformBillingStats(): Promise<PlatformBillingStats> {
  const [activeCount, gracePeriodCount, byPlanRows, promotionCount, recentPayments] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "grace_period")),

      db
        .select({ plan: subscriptions.plan, count: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active"))
        .groupBy(subscriptions.plan),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.source, "promotion")),

      db
        .select()
        .from(payments)
        .orderBy(desc(payments.createdAt))
        .limit(20),
    ]);

  const planCounts = { standard: 0, premium: 0 };
  for (const row of byPlanRows) {
    if (row.plan === "standard") planCounts.standard = row.count;
    if (row.plan === "premium") planCounts.premium = row.count;
  }

  return {
    totalActiveSubscriptions: activeCount[0]?.count ?? 0,
    totalInGracePeriod: gracePeriodCount[0]?.count ?? 0,
    byPlan: planCounts,
    fromPromotion: promotionCount[0]?.count ?? 0,
    recentPayments: recentPayments as PaymentRow[],
  };
}
