"use client";

import * as React from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import countries from "world-countries";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(
  countries.map((c) => [c.cca2, c.name.common]),
);

type CountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
};

const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: COUNTRY_NAMES[code] ?? code,
    callingCode: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function callingCodeFor(country: CountryCode): string {
  return getCountryCallingCode(country);
}

export interface PhoneInputProps {
  name?: string;
  defaultValue?: string | null;
  onChange?: (e164: string) => void;
  defaultCountry?: CountryCode;
  lockedCountry?: CountryCode;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function PhoneInput({
  name,
  defaultValue,
  onChange,
  defaultCountry = "RW",
  lockedCountry,
  id,
  required,
  disabled,
  placeholder = "788 123 456",
  error,
  className,
}: PhoneInputProps) {
  const parsed = defaultValue
    ? parsePhoneNumberFromString(defaultValue)
    : undefined;

  const [country, setCountry] = React.useState<CountryCode>(
    lockedCountry ?? parsed?.country ?? defaultCountry,
  );
  const [national, setNational] = React.useState(parsed?.nationalNumber ?? "");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const e164 = React.useMemo(() => {
    const digits = national.replace(/\D/g, "");
    return digits ? `+${callingCodeFor(country)}${digits}` : "";
  }, [country, national]);

  const filteredCountries = React.useMemo(() => {
    if (!search) return COUNTRY_OPTIONS;
    const q = search.toLowerCase();
    return COUNTRY_OPTIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.callingCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const selectCountry = (code: CountryCode) => {
    setCountry(code);
    setDropdownOpen(false);
    setSearch("");
    const digits = national.replace(/\D/g, "");
    onChange?.(digits ? `+${callingCodeFor(code)}${digits}` : "");
  };

  const handleNational = (raw: string) => {
    setNational(raw);
    const digits = raw.replace(/\D/g, "");
    onChange?.(digits ? `+${callingCodeFor(country)}${digits}` : "");
  };

  const isLocked = Boolean(lockedCountry);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-md border bg-background text-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          error && "border-destructive focus-within:ring-destructive/20 focus-within:border-destructive",
          !error && "border-input",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <button
          type="button"
          disabled={disabled || isLocked}
          onClick={() => !isLocked && setDropdownOpen((o) => !o)}
          className={cn(
            "inline-flex h-full shrink-0 items-center gap-1.5 border-r border-input px-2.5 text-sm",
            !isLocked && "hover:bg-muted/50 cursor-pointer",
            isLocked && "cursor-default bg-muted/40 text-muted-foreground",
          )}
        >
          <CountryFlag code={country} />
          {!isLocked && <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />}
        </button>

        <span className="shrink-0 pl-2.5 text-sm font-medium text-foreground select-none">
          +{callingCodeFor(country)}
        </span>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={national}
          onChange={(e) => handleNational(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          className="h-full w-full bg-transparent pl-1.5 pr-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-input bg-popover shadow-md"
        >
          <div className="border-b border-input p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredCountries.map(({ code, name, callingCode }) => (
              <button
                key={code}
                type="button"
                onClick={() => selectCountry(code)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer",
                  code === country && "bg-accent/50",
                )}
              >
                <CountryFlag code={code} />
                <span className="truncate">{name}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">+{callingCode}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}

      {name && <input type="hidden" name={name} value={e164} />}
    </div>
  );
}
