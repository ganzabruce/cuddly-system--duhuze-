"use client";

import { useMemo, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import countries from "world-countries";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TimezonePicker } from "@/components/ui/timezone-picker";
import { SearchablePicker } from "@/components/ui/searchable-picker";
import { DEFAULT_TIMEZONE_ID } from "@/lib/utils/timezones";
import { CountryFlag } from "@/components/ui/country-flag";
import { updateGeneralSettingsAction, updateAppearanceAction } from "@/actions/auth/actions";
import type { UserLocation, UserSettings } from "@/types/auth";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants/billing/currencies";
import { toast } from "sonner";
import { rowClass, switchRowClass } from "@/components/auth/settingsStyles";
import { SettingsThemeSwitcher } from "@/components/auth/SettingsThemeSwitcher";

const sortedCountries = countries
    .map((c) => ({ code: c.cca2, name: c.name.common }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const GENERAL_TAB_CONFIG = { value: "general", label: "General", Icon: GlobeAltIcon } as const;

type SettingsGeneralTabProps = {
    initialSettings: UserSettings | null;
};

export function SettingsGeneralTab({ initialSettings }: SettingsGeneralTabProps) {
    const [currency, setCurrency] = useState(initialSettings?.preferredCurrency ?? "");
    const [country, setCountry] = useState(initialSettings?.location?.country ?? "");
    const [city, setCity] = useState(initialSettings?.location?.city?.name ?? "");
    const [timezone, setTimezone] = useState(
        () => initialSettings?.timezone ?? DEFAULT_TIMEZONE_ID,
    );
    const [dateFormat, setDateFormat] = useState<"12h" | "24h">(
        initialSettings?.preferences?.dateFormat ?? "12h",
    );
    const [isSavingGeneral, startGeneralTransition] = useTransition();

    const [theme, setThemeState] = useState<string>(
        initialSettings?.preferences?.theme ?? "system",
    );
    const { setTheme: setNextTheme } = useTheme();
    const [isSavingTheme, startThemeTransition] = useTransition();

    const currencyOptions = useMemo(
        () =>
            CURRENCIES.map((c) => ({
                value: c.code,
                label: (
                    <>
                        <CountryFlag code={c.country} /> {c.label}
                    </>
                ),
                searchTerms: `${c.label} ${c.code}`,
                suffix: c.symbol,
            })),
        [],
    );

    const countryOptions = useMemo(
        () =>
            sortedCountries.map((c) => ({
                value: c.code,
                label: (
                    <>
                        <CountryFlag code={c.code} /> {c.name}
                    </>
                ),
                searchTerms: `${c.name} ${c.code}`,
            })),
        [],
    );

    const saveGeneral = () => {
        startGeneralTransition(async () => {
            const location: UserLocation | null =
                country && country.length >= 2
                    ? {
                        country: country.toUpperCase(),
                        city: city.trim() ? { name: city.trim() } : null,
                    }
                    : null;

            const result = await updateGeneralSettingsAction({
                preferredCurrency: currency || null,
                location,
                timezone: timezone || null,
                dateFormat,
            });

            if (result.success) toast.success("Settings saved");
            else toast.error(result.error);
        });
    };

    const handleTheme = (value: string) => {
        setThemeState(value);
        setNextTheme(value);
        startThemeTransition(async () => {
            const result = await updateAppearanceAction(
                value as "light" | "dark" | "system",
            );
            if (!result.success) toast.error(result.error);
        });
    };

    return (
        <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <h2 className="m-0 text-base font-semibold text-foreground">General</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Timezone, currency, location, and appearance
                </p>
            </div>
            <div className="divide-y divide-border px-4 py-2">
                {/* Timezone */}
                <div className={rowClass}>
                    <div>
                        <Label className="text-sm font-medium">Timezone</Label>
                        <p className="text-xs text-muted-foreground">
                            Used for event times and reminders
                        </p>
                    </div>
                    <div className="w-full sm:w-96">
                        <TimezonePicker value={timezone} onValueChange={setTimezone} />
                    </div>
                </div>

                {/* Currency */}
                <div className={rowClass}>
                    <div>
                        <Label className="text-sm font-medium">Currency</Label>
                        <p className="text-xs text-muted-foreground">
                            For contributions and display
                        </p>
                    </div>
                    <div className="w-full sm:w-96">
                        <SearchablePicker
                            value={currency}
                            onValueChange={setCurrency}
                            options={currencyOptions}
                            placeholder="Select currency"
                            searchPlaceholder="Search currency…"
                            emptyMessage="No currencies found."
                            align="end"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className={rowClass}>
                    <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <p className="text-xs text-muted-foreground">Country and optional city</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-96 sm:flex-row">
                        <SearchablePicker
                            value={country}
                            onValueChange={setCountry}
                            options={countryOptions}
                            placeholder="Country"
                            searchPlaceholder="Search country"
                            emptyMessage="No countries found."
                            align="end"
                            triggerClassName="w-full sm:flex-1"
                        />
                        <Input
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full sm:flex-1"
                        />
                    </div>
                </div>

                {/* Time format */}
                <div className={switchRowClass}>
                    <div>
                        <Label className="text-sm font-medium">Time format</Label>
                        <p className="text-xs text-muted-foreground">12-hour or 24-hour clock</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "text-sm transition-colors",
                                dateFormat === "12h"
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            12h
                        </span>
                        <Switch
                            checked={dateFormat === "24h"}
                            onCheckedChange={(checked) =>
                                setDateFormat(checked ? "24h" : "12h")
                            }
                        />
                        <span
                            className={cn(
                                "text-sm transition-colors",
                                dateFormat === "24h"
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            24h
                        </span>
                    </div>
                </div>

                {/* Theme */}
                <div className={switchRowClass}>
                    <div>
                        <Label className="text-sm font-medium">Theme</Label>
                        <p className="text-xs text-muted-foreground">Choose how the app looks</p>
                    </div>
                    <SettingsThemeSwitcher
                        theme={theme}
                        disabled={isSavingTheme}
                        onChange={handleTheme}
                    />
                </div>
            </div>
            <div className="flex justify-end border-t border-border px-4 py-3">
                <Button onClick={saveGeneral} disabled={isSavingGeneral} size="sm">
                    {isSavingGeneral ? "Saving…" : "Save preferences"}
                </Button>
            </div>
        </div>
    );
}
