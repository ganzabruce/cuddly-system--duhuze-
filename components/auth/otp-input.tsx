"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function OTPInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    className,
}: OTPInputProps) {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (index: number, digitValue: string) => {
        const digit = digitValue.replace(/[^0-9]/g, "");

        if (digit.length > 1) {
            // Handle multi-character input (paste or auto-fill)
            const digits = digit.slice(0, length - index).split("");
            const currentValue = value || "";
            const newValue = currentValue.padEnd(length, " ").split("");

            digits.forEach((d, i) => {
                if (index + i < length) {
                    newValue[index + i] = d;
                }
            });

            const finalValue = newValue.join("").trim();
            onChange(finalValue);

            // Focus the appropriate input
            const nextIndex = Math.min(index + digits.length, length - 1);
            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus();
            }, 0);
        } else if (digit) {
            const currentValue = value || "";
            const newValue = currentValue.padEnd(length, " ").split("");
            newValue[index] = digit;
            const finalValue = newValue.join("").trim();
            onChange(finalValue);

            if (index < length - 1) {
                setTimeout(() => {
                    inputRefs.current[index + 1]?.focus();
                }, 0);
            }
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const currentValue = value || "";
            const newValue = currentValue.padEnd(length, " ").split("");

            if (newValue[index] && newValue[index].trim()) {
                newValue[index] = "";
                const finalValue = newValue.join("").trim();
                onChange(finalValue);
            } else if (index > 0) {
                newValue[index - 1] = "";
                const finalValue = newValue.join("").trim();
                onChange(finalValue);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        } else if (e.key === "Delete" && index < length - 1) {
            e.preventDefault();
            const currentValue = value || "";
            const newValue = currentValue.padEnd(length, " ").split("");
            newValue[index] = "";
            const finalValue = newValue.join("").trim();
            onChange(finalValue);
        }
    };

    const handlePaste = (e: React.ClipboardEvent, index: number) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain");
        const pasteDigits = pastedData
            .replace(/[^0-9]/g, "")
            .slice(0, length - index);

        const currentValue = value || "";
        const newValue = currentValue.padEnd(length, " ").split("");
        pasteDigits.split("").forEach((d, i) => {
            if (index + i < length) {
                newValue[index + i] = d;
            }
        });

        const finalValue = newValue.join("").trim();
        onChange(finalValue);

        // Focus the next empty input or the last input
        const nextIndex = Math.min(index + pasteDigits.length, length - 1);
        setTimeout(() => {
            inputRefs.current[nextIndex]?.focus();
        }, 0);
    };

    const digits = (value || "").padEnd(length, " ").split("").slice(0, length);

    return (
        <div className={cn("flex gap-2 justify-center", className)}>
            {digits.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit === " " ? "" : digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(e, index)}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-12 text-center text-lg font-semibold",
                        "bg-background border-input",
                        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        digit.trim() && "border-primary",
                    )}
                    aria-label={`Digit ${index + 1} of ${length}`}
                />
            ))}
        </div>
    );
}

export interface OTPVerificationFormProps {
    title?: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onBack?: () => void;
    onResend?: () => void;
    isLoading?: boolean;
    error?: string;
    successMessage?: string;
    submitButtonText?: string;
    backButtonText?: string;
    length?: number;
    className?: string;
}

export function OTPVerificationForm({
    title = "Verify your identity",
    description = "Enter the verification code sent to your email",
    value,
    onChange,
    onSubmit,
    onBack,
    onResend,
    isLoading = false,
    error,
    successMessage,
    submitButtonText = "Verify",
    backButtonText = "Go back",
    length = 6,
    className,
}: OTPVerificationFormProps) {
    const isComplete = value.length === length;

    return (
        <form
            onSubmit={onSubmit}
            className={cn("flex flex-col gap-6", className)}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    {description}
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-destructive-surface border border-destructive/20 p-4">
                    <p className="text-destructive text-sm text-center">
                        {error}
                    </p>
                </div>
            )}

            {successMessage && (
                <div className="rounded-md bg-success/10 border border-success/30 p-4">
                    <p className="text-success text-sm text-center">
                        {successMessage}
                    </p>
                </div>
            )}

            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label
                        htmlFor="otp-input"
                        className="text-foreground text-center"
                    >
                        Verification Code
                    </Label>
                    <OTPInput
                        value={value}
                        onChange={onChange}
                        length={length}
                        disabled={isLoading}
                    />
                </div>

                {onResend && (
                    <Button
                        type="button"
                        onClick={onResend}
                        variant="link"
                        className="w-full text-sm text-muted-foreground hover:text-foreground p-0"
                    >
                        Didn&apos;t receive the code? Resend
                    </Button>
                )}

                <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={isLoading || !isComplete}
                >
                    {isLoading ? "Verifying..." : submitButtonText}
                </Button>


                {onBack && (
                    <Button
                        type="button"
                        onClick={onBack}
                        variant="outline"
                        className="w-full"
                    >
                        {backButtonText}
                    </Button>
                )}
            </div>
        </form>
    );
}
