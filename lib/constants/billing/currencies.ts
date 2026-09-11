export type CurrencyOption = {
  code: string;
  label: string;
  symbol: string;
  country: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$", country: "US" },
  { code: "EUR", label: "Euro", symbol: "EUR", country: "EU" },
  { code: "RWF", label: "Rwandan Franc", symbol: "FRW", country: "RW" },
  { code: "GBP", label: "British Pound", symbol: "GBP", country: "GB" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$", country: "CA" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF", country: "CH" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh", country: "KE" },
  { code: "UGX", label: "Ugandan Shilling", symbol: "USh", country: "UG" },
];

const CURRENCY_MAP = new Map(
  CURRENCIES.map((currency) => [currency.code, currency]),
);

export function getCurrencyByCode(code: string | null | undefined) {
  if (!code) return null;
  return CURRENCY_MAP.get(code.toUpperCase()) ?? null;
}

export function isSupportedCurrency(
  code: string | null | undefined,
): code is string {
  if (!code) return false;
  return CURRENCY_MAP.has(code.toUpperCase());
}
