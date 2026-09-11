import { requestConfiguredPayment } from "@/lib/services/billing/providers/intouch";
import { env } from "@/lib/env";

console.log("Base URL:", env.INTOUCH_BASE_URL);

const response = await requestConfiguredPayment({
  config: {
    baseUrl: env.INTOUCH_BASE_URL,
    username: env.INTOUCH_USERNAME,
    accountNo: env.INTOUCH_ACCOUNT_NO,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
  },
  mobilePhone: "+250791892006",
  amount: 210,
  requestTransactionId: `test-${Date.now()}`,
});

console.log(JSON.stringify(response, null, 2));
