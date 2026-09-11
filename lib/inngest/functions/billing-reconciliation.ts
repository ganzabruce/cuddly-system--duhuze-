import { inngest } from "../client";
import {
  reconcilePendingPayments,
} from "@/lib/services/billing/reconciliation";
import { expireGracePeriodSubscriptions } from "@/lib/services/billing/subscriptions";
import { reconcilePendingEventPayments } from "@/actions/events/payments/status";
import { reconcileProcessingEventWithdrawals } from "@/lib/services/events/withdrawals";

export const billingReconciliationCron = inngest.createFunction(
  {
    id: "billing-reconciliation-cron",
    name: "Billing Reconciliation (Pending Payments & Grace Periods)",
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const { succeededPaymentIds, failedPaymentIds } = await step.run(
      "reconcile-pending-payments",
      async () => {
        return await reconcilePendingPayments({ maxAgeMinutes: 5 });
      }
    );

    const { expiredSubscriptionIds, affectedUserIds } = await step.run(
      "expire-grace-period-subscriptions",
      async () => {
        return await expireGracePeriodSubscriptions();
      }
    );

    const { succeededWithdrawalIds, failedWithdrawalIds } = await step.run(
      "reconcile-event-withdrawals",
      async () => {
        return await reconcileProcessingEventWithdrawals({ maxAgeMinutes: 5 });
      },
    );

    const { succeededPaymentIds: succeededEventPaymentIds, failedPaymentIds: failedEventPaymentIds } =
      await step.run("reconcile-event-payments", async () => {
        return await reconcilePendingEventPayments({ maxAgeMinutes: 5 });
      });

    return {
      succeededPaymentsCount: succeededPaymentIds.length,
      failedPaymentsCount: failedPaymentIds.length,
      succeededEventPaymentsCount: succeededEventPaymentIds.length,
      failedEventPaymentsCount: failedEventPaymentIds.length,
      succeededWithdrawalsCount: succeededWithdrawalIds.length,
      failedWithdrawalsCount: failedWithdrawalIds.length,
      expiredSubscriptionsCount: expiredSubscriptionIds.length,
      affectedUsersCount: affectedUserIds.length,
    };
  }
);
