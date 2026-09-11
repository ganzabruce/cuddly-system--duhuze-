"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { completeOnboardingAction } from "@/actions/auth/onboarding";

interface OnboardingFormProps {
    initialError?: string;
    profileHost: string;
    redirectUrl?: string;
    firstName?: string;
    lastName?: string;
}

export function OnboardingForm({
    initialError,
    profileHost,
    redirectUrl,
    firstName,
    lastName,
}: OnboardingFormProps) {
    const [state, formAction, isPending] = useActionState(
        completeOnboardingAction,
        { error: initialError || null }
    );

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-foreground">
                    Set up your profile
                </h1>
                <p className="text-sm text-muted-foreground">
                    Confirm your details and choose a username.
                </p>
            </div>

            {state.error && (
                <div className="rounded-md bg-destructive-surface border border-destructive/20 px-4 py-3">
                    <p className="text-destructive text-sm">{state.error}</p>
                </div>
            )}

            <form action={formAction} className="flex flex-col gap-5">
                <input
                    type="hidden"
                    name="redirectUrl"
                    value={redirectUrl ?? ""}
                />
                {/* First / Last name */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First name</Label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            defaultValue={firstName}
                            autoComplete="given-name"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary transition-all duration-200"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            defaultValue={lastName}
                            autoComplete="family-name"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary transition-all duration-200"
                        />
                    </div>
                </div>
                {/* Username */}
                <div className="grid gap-2">
                    <Label htmlFor="username">
                        Username <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex rounded-md border border-input transition-all duration-200 hover:border-muted-foreground/50 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary overflow-hidden">
                        <span className="flex items-center px-3 bg-background border-r border-input text-muted-foreground text-sm shrink-0 select-none">
                            {profileHost}/
                        </span>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="yourname"
                            required
                            autoComplete="off"
                            autoFocus
                            className="flex-1 min-w-0 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Lowercase letters, numbers, and dashes only · 3–30 characters
                    </p>
                </div>


                <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={isPending}
                >
                    {isPending ? "Setting up…" : "Finish setup"}
                </Button>
            </form>
        </div>
    );
}
