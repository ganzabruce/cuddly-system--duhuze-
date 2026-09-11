"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/admin/auth";
import { getPlatformBillingStats } from "@/lib/services/admin/billing-queries";
import { startPromotion, stopPromotion, getActivePromotion } from "@/lib/services/billing/promotions";
import { logAdminAction } from "@/lib/services/admin/audit-log";

export async function getBillingPageDataAction() {
  await requireAdmin();

  const [stats, activePromotion] = await Promise.all([
    getPlatformBillingStats(),
    getActivePromotion(),
  ]);

  return {
    stats: {
      ...stats,
      recentPayments: stats.recentPayments.map((p) => ({
        ...p,
        createdAt: p.createdAt ? p.createdAt.toISOString() : null,
      })),
    },
    activePromotion: activePromotion
      ? {
          ...activePromotion,
          startedAt: activePromotion.startedAt.toISOString(),
          endsAt: activePromotion.endsAt.toISOString(),
        }
      : null,
  };
}

export type BillingPageData = Awaited<ReturnType<typeof getBillingPageDataAction>>;

export async function startPromotionAction(input: {
  slug: string;
  plan: "standard" | "premium";
  endsAt: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  if (input.plan !== "standard" && input.plan !== "premium") {
    return { success: false, error: "Plan must be standard or premium" };
  }

  const slugTrimmed = input.slug.trim().toLowerCase();
  if (!slugTrimmed || !/^[a-z0-9-]+$/.test(slugTrimmed)) {
    return { success: false, error: "Slug must be lowercase alphanumeric with hyphens only" };
  }

  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) {
    return { success: false, error: "End date must be a valid future date" };
  }

  try {
    const promotion = await startPromotion({
      slug: slugTrimmed,
      plan: input.plan,
      endsAt,
      adminEmail: admin.email,
      notes: input.notes,
    });

    await logAdminAction({
      adminEmail: admin.email,
      action: "billing.promotion.start",
      details: {
        promotionId: promotion.id,
        slug: slugTrimmed,
        plan: input.plan,
        endsAt: endsAt.toISOString(),
      },
    });

    revalidatePath("/pricing");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start promotion",
    };
  }
}

export async function stopPromotionAction(): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await stopPromotion(admin.email);

    await logAdminAction({
      adminEmail: admin.email,
      action: "billing.promotion.stop",
    });

    revalidatePath("/pricing");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to stop promotion",
    };
  }
}
