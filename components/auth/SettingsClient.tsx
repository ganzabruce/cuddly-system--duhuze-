"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserSettings } from "@/types/auth";
import { SettingsGeneralTab, GENERAL_TAB_CONFIG } from "@/components/auth/SettingsGeneralTab";
import {
    SettingsNotificationsTab,
    NOTIFICATIONS_TAB_CONFIG,
} from "@/components/auth/SettingsNotificationsTab";
import { SettingsAccountTab, ACCOUNT_TAB_CONFIG } from "@/components/auth/SettingsAccountTab";

const TAB_CONFIG = [GENERAL_TAB_CONFIG, NOTIFICATIONS_TAB_CONFIG, ACCOUNT_TAB_CONFIG] as const;

type SettingsClientProps = {
    initialSettings: UserSettings | null;
    username: string | null;
    userEmail: string;
};

export function SettingsClient({
    initialSettings,
    username,
    userEmail,
}: SettingsClientProps) {
    return (
        <Tabs defaultValue="general" className="w-full">
            <TabsList variant="line" className="mb-5 w-full">
                {TAB_CONFIG.map(({ value, label, Icon }) => (
                    <TabsTrigger key={value} value={value} variant="line" className="gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value="general" className="mt-0">
                <SettingsGeneralTab initialSettings={initialSettings} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
                <SettingsNotificationsTab initialSettings={initialSettings} />
            </TabsContent>

            <TabsContent value="account" className="mt-0">
                <SettingsAccountTab username={username} userEmail={userEmail} />
            </TabsContent>
        </Tabs>
    );
}
