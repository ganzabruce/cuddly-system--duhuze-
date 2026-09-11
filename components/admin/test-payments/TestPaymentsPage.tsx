"use client";

import { useState, useTransition } from "react";
import {
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
  adminTestPaymentAction,
  adminCheckTestPaymentAction,
} from "@/actions/admin/test-payments";
import type { TestPaymentResult, CheckResult } from "@/types/admin";

type TestGateway = "intouch" | "pesapal";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-ring focus:ring-[3px] focus:ring-ring/50 focus:outline-none";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

const STATUS_UI = {
  pending: {
    icon: ClockIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Pending",
  },
  succeeded: {
    icon: CheckCircleIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Succeeded",
  },
  failed: {
    icon: ExclamationCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Failed",
  },
} as const;

export function TestPaymentsPage() {
  const [amount, setAmount] = useState("");
  const [gateway, setGateway] = useState<TestGateway>("intouch");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");

  const [result, setResult] = useState<TestPaymentResult | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isChecking, startCheckTransition] = useTransition();

  const currentStatus = checkResult?.status ?? result?.status ?? null;
  const isPesapal = gateway === "pesapal";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    const parsed = Number(amount);
    if (!parsed || parsed < 1) return;

    setError(null);
    setCheckResult(null);
    setResult(null);

    startTransition(async () => {
      const res = await adminTestPaymentAction({
        amount: parsed,
        gateway,
        payerPhone,
        payerName,
      });
      if (res.ok) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  function handleCheckStatus() {
    if (!result || isChecking) return;

    startCheckTransition(async () => {
      const res = await adminCheckTestPaymentAction({
        paymentId: result.paymentId,
      });
      if (res.ok) {
        setCheckResult(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-md border border-border bg-card">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-foreground">
            Test Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Initiate a test payment through Intouch (mobile money) or Pesapal
            (card).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
              <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-blue-500" />
            </div>
            Mobile Money / Card Deposit
          </div>

          <label className="block">
            <span className={labelClass}>Gateway</span>
            <select
              className={inputClass}
              value={gateway}
              onChange={(e) => setGateway(e.target.value as TestGateway)}
            >
              <option value="intouch">Mobile Money (Intouch)</option>
              <option value="pesapal">Card (Pesapal)</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Amount (RWF)</span>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={1000000}
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(inputClass, "pl-9")}
                required
              />
              <CurrencyDollarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
            </div>
          </label>

          {!isPesapal && (
            <>
              <label className="block">
                <span className={labelClass}>Phone Number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="07XXXXXXXX"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
            </>
          )}

          <label className="block">
            <span className={labelClass}>Payer Name</span>
            <input
              type="text"
              placeholder="John Doe"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className={inputClass}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            )}
            {isPending ? "Sending…" : "Send Payment Request"}
          </button>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </form>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">Result</h3>

          {!result ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <CurrencyDollarIcon className="mb-2 h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Submit a test payment to see results here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentStatus &&
                currentStatus in STATUS_UI && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2",
                      STATUS_UI[currentStatus as keyof typeof STATUS_UI].bg,
                    )}
                  >
                    {(() => {
                      const s =
                        STATUS_UI[currentStatus as keyof typeof STATUS_UI];
                      const Icon = s.icon;
                      return (
                        <>
                          <Icon className={cn("h-4 w-4", s.color)} />
                          <span
                            className={cn("text-sm font-semibold", s.color)}
                          >
                            {s.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-foreground">
                    {result.paymentId}
                  </span>
                </div>
                {result.providerTransactionId && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">
                      Provider Tx ID
                    </span>
                    <span className="font-mono text-foreground">
                      {result.providerTransactionId}
                    </span>
                  </div>
                )}
              </div>

              {result.redirectUrl && (
                <div className="space-y-2 rounded-lg bg-secondary/60 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Pesapal requires a redirect to complete payment.
                  </p>
                  <a
                    href={result.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    Open Pesapal
                  </a>
                </div>
              )}

              {currentStatus === "pending" && (
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isChecking ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                  )}
                  Check Status
                </button>
              )}

              {(result.rawResponse != null || checkResult?.rawResponse != null) ? (
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    Raw Response
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
                    {JSON.stringify(
                      checkResult?.rawResponse ?? result.rawResponse,
                      null,
                      2,
                    )}
                  </pre>
                </details>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
