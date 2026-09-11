import {
  CreditCardIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { PlatformBillingStats } from "@/types/admin";
import type { PaymentRow } from "@/types/billing";
import { StatCard } from "@/components/layout/StatCard";

type SerializedPaymentRow = Omit<PaymentRow, "createdAt"> & { createdAt: string | null };
type SerializedBillingStats = Omit<PlatformBillingStats, "recentPayments"> & {
  recentPayments: SerializedPaymentRow[];
};

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: "bg-success-surface text-success-deep",
    pending: "bg-warning-surface text-warning-deep",
    failed: "bg-destructive-surface text-destructive-deep",
    refunded: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.refunded}`}>
      {status}
    </span>
  );
}

export function BillingStatsCards({ stats }: { stats: SerializedBillingStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        <StatCard title="Active Subscriptions" value={stats.totalActiveSubscriptions} icon={CreditCardIcon} />
        <StatCard title="In Grace Period" value={stats.totalInGracePeriod} icon={ClockIcon} />
        <StatCard title="Standard Plan" value={stats.byPlan.standard} icon={UserGroupIcon} />
        <StatCard title="Premium Plan" value={stats.byPlan.premium} icon={SparklesIcon} />
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-base font-semibold text-foreground">Recent Payments</h2>
        </div>
        {stats.recentPayments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="px-3 py-2.5 sm:px-5 sm:py-3">User</th>
                  <th className="px-3 py-2.5 sm:px-5 sm:py-3">Plan</th>
                  <th className="px-3 py-2.5 sm:px-5 sm:py-3">Amount</th>
                  <th className="px-3 py-2.5 sm:px-5 sm:py-3">Status</th>
                  <th className="px-3 py-2.5 sm:px-5 sm:py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment: SerializedPaymentRow) => (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-muted-foreground">#{payment.userId}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3 capitalize">{payment.plan}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3">{formatAmount(payment.amount, payment.currency)}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-muted-foreground">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
