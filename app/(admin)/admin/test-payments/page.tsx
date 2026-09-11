import { requireAdmin } from "@/actions/admin/auth";
import { TestPaymentsPage } from "@/components/admin/test-payments/TestPaymentsPage";

export default async function AdminTestPaymentsRoute() {
  await requireAdmin();
  return <TestPaymentsPage />;
}
