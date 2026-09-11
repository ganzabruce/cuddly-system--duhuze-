"use client";

import { useState, useTransition } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateAdminProfileAction } from "@/actions/admin/settings";

type AdminSettingsClientProps = {
    adminEmail: string;
    adminName: string;
};

export function AdminSettingsClient({ adminEmail, adminName }: AdminSettingsClientProps) {
    const [name, setName] = useState(adminName);
    const [isSavingProfile, startSavingProfile] = useTransition();
    const [profileMessage, setProfileMessage] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);

    const handleProfileSave = () => {
        setProfileMessage(null);
        setProfileError(null);
        startSavingProfile(async () => {
            const result = await updateAdminProfileAction({ name });
            if (result.success) {
                setProfileMessage("Profile updated");
            } else {
                setProfileError(result.error ?? "Unable to update profile");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="divide-y divide-border rounded-md border border-border bg-card">
                <section className="p-5 space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">Profile</h3>
                        <p className="text-sm text-muted-foreground">Update display info for admin actions.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input id="admin-email" value={adminEmail} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-name">Name</Label>
                        <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    {profileMessage && <p className="text-sm text-success">{profileMessage}</p>}
                    {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                    <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                        {isSavingProfile ? "Saving…" : "Save changes"}
                    </Button>
                </section>
            </div>

            <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-card px-6 py-4">
                <div>
                    <h3 className="font-medium text-destructive">End Session</h3>
                    <p className="hidden text-sm text-muted-foreground lg:block">Log out of your session.</p>
                </div>
                <SignOutButton redirectUrl="/login">
                    <Button variant="destructive" className="gap-2">
                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                        Sign out
                    </Button>
                </SignOutButton>
            </div>
        </div>
    );
}
