import db from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { and, eq, lte, gte, desc } from "drizzle-orm";
import type { ActivePromotion, PromotionRow } from "@/types/billing";

export async function getActivePromotion(): Promise<ActivePromotion | null> {
  const now = new Date();
  const result = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        lte(promotions.startedAt, now),
        gte(promotions.endsAt, now),
      ),
    )
    .limit(1);

  const row = result[0];
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    plan: row.plan as "standard" | "premium",
    startedAt: row.startedAt,
    endsAt: row.endsAt,
    startedByEmail: row.startedByEmail,
  };
}

export async function startPromotion(input: {
  slug: string;
  plan: "standard" | "premium";
  endsAt: Date;
  adminEmail: string;
  notes?: string;
}): Promise<ActivePromotion> {
  const existing = await getActivePromotion();
  if (existing) {
    throw new Error("A promotion is already active — stop it before starting a new one");
  }

  const [row] = await db
    .insert(promotions)
    .values({
      slug: input.slug,
      plan: input.plan,
      endsAt: input.endsAt,
      isActive: true,
      startedByEmail: input.adminEmail,
      notes: input.notes ?? null,
    })
    .returning();

  return {
    id: row.id,
    slug: row.slug,
    plan: row.plan as "standard" | "premium",
    startedAt: row.startedAt,
    endsAt: row.endsAt,
    startedByEmail: row.startedByEmail,
  };
}

export async function stopPromotion(adminEmail: string): Promise<void> {
  await db
    .update(promotions)
    .set({ isActive: false, stoppedAt: new Date(), stoppedByEmail: adminEmail })
    .where(eq(promotions.isActive, true));
}

export async function getPromotionHistory(): Promise<PromotionRow[]> {
  return db
    .select()
    .from(promotions)
    .orderBy(desc(promotions.startedAt));
}
