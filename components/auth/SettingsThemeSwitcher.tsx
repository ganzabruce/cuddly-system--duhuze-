"use client";

import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const THEMES = [
    { value: "light", Icon: SunIcon },
    { value: "dark", Icon: MoonIcon },
    { value: "system", Icon: ComputerDesktopIcon },
] as const;

type SettingsThemeSwitcherProps = {
    theme: string;
    disabled: boolean;
    onChange: (value: string) => void;
};

export function SettingsThemeSwitcher({ theme, disabled, onChange }: SettingsThemeSwitcherProps) {
    return (
        <div className="flex overflow-hidden rounded-md border border-border">
            {THEMES.map(({ value, Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    disabled={disabled}
                    className={cn(
                        "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                        theme === value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}
