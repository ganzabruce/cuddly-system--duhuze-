import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
    scheduledRemindersCron,
    sendEventReminder,
} from "@/lib/inngest/functions/scheduled-reminders";
import { billingReconciliationCron } from "@/lib/inngest/functions/billing-reconciliation";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [scheduledRemindersCron, sendEventReminder, billingReconciliationCron],
});
