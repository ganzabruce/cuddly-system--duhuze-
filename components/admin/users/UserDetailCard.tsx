import { cn } from "@/lib/utils";
import {
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import type { AdminUserDetail, UserWithStats } from "@/types/admin";

type UserDetailCardProps = {
    user: UserWithStats | AdminUserDetail;
};

function isAdminUserDetail(user: UserWithStats | AdminUserDetail): user is AdminUserDetail {
    return "profileImageUrl" in user;
}

/* ------------------------------------------------------------------ */
/*  Row                                                                */
/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex gap-2 items-start">
            <span className="shrink-0 text-xs text-muted-foreground font-medium uppercase tracking-wider leading-relaxed min-w-[100px]">
                {label}
            </span>
            <span className="min-w-0 flex-1 text-sm text-foreground break-words leading-relaxed">
                {value}
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {title}
            </h3>
            <div className={cn("grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2", className)}>
                {children}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Preferences formatter                                              */
/* ------------------------------------------------------------------ */

const PREFERENCE_LABELS: Record<string, string> = {
    theme: "Theme",
    language: "Language",
    dateFormat: "Date format",
    "notifications.push": "Push notifications",
    "notifications.email": "Email notifications",
    "notifications.whatsapp": "WhatsApp notifications",
    "notifications.rsvpUpdates": "RSVP updates",
    "notifications.eventReminders": "Event reminders",
    "notifications.marketingUpdates": "Marketing updates",
};

function formatPreferences(
    obj: Record<string, unknown>,
    prefix = "",
): { label: string; value: string }[] {
    const out: { label: string; value: string }[] = [];
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            out.push(...formatPreferences(v as Record<string, unknown>, key));
        } else {
            const label = PREFERENCE_LABELS[key] ?? key;
            const value =
                v === null ? "—" :
                typeof v === "boolean" ? (v ? "Yes" : "No") :
                String(v);
            out.push({ label, value });
        }
    }
    return out;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UserDetailCard({ user }: UserDetailCardProps) {
    const formatDate = (date: Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleString();
    };

    const fullUser = isAdminUserDetail(user) ? user : null;
    const country = fullUser?.location?.country;
    const city = fullUser?.location?.city?.name;
    const locationStr = [city, country].filter(Boolean).join(", ") || null;
    const isSuspended =
        user.status != null && String(user.status).toLowerCase() === "suspended";

    const initials = user.name
        ?.split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() ?? "?";

    const hasLocation = fullUser && (locationStr || fullUser.timezone || fullUser.preferredCurrency);
    const hasPreferences = fullUser?.preferences && typeof fullUser.preferences === "object" && Object.keys(fullUser.preferences).length > 0;

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex items-start gap-4">
                <Avatar size="lg" className="size-14 text-lg">
                    {fullUser?.profileImageUrl && (
                        <AvatarImage src={fullUser.profileImageUrl} alt={user.name ?? ""} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground leading-tight">
                        {user.name || "Unnamed user"}
                    </h2>
                    {user.username && (
                        <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                    <div className="mt-2">
                        <Badge variant={isSuspended ? "destructive" : "success"}>
                            {isSuspended ? (
                                <XCircleIcon className="h-3 w-3" />
                            ) : (
                                <CheckCircleIcon className="h-3 w-3" />
                            )}
                            {isSuspended ? "Suspended" : "Active"}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* ── Account ── */}
            <Section title="Account">
                <Row label="Name" value={user.name || "—"} />
                <Row label="Email" value={user.email} />
                {user.username && <Row label="Username" value={`@${user.username}`} />}
                <Row label="Status" value={isSuspended ? "Suspended" : "Active"} />
                <Row label="Events" value={String(user.eventsCount)} />
                <Row label="Created" value={formatDate(user.createdAt)} />
            </Section>

            {/* ── Suspension ── */}
            {isSuspended && (user.suspendedAt || user.suspendedReason) && (
                <Section title="Suspension">
                    {user.suspendedAt && (
                        <Row label="Suspended at" value={formatDate(user.suspendedAt)} />
                    )}
                    {user.suspendedReason && (
                        <Row label="Reason" value={user.suspendedReason} />
                    )}
                </Section>
            )}

            {/* ── Contact ── */}
            {fullUser && (
                <Section title="Contact">
                    {fullUser.publicEmail && (
                        <Row label="Public email" value={fullUser.publicEmail} />
                    )}
                    {fullUser.phoneNumber && (
                        <Row label="Phone" value={fullUser.phoneNumber} />
                    )}
                    {fullUser.websiteUrl && (
                        <Row
                            label="Website"
                            value={
                                <a
                                    href={fullUser.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all"
                                >
                                    {fullUser.websiteUrl}
                                </a>
                            }
                        />
                    )}
                    {!fullUser.publicEmail && !fullUser.phoneNumber && !fullUser.websiteUrl && (
                        <p className="col-span-2 text-sm text-muted-foreground italic">No contact info provided.</p>
                    )}
                </Section>
            )}

            {/* ── Preferences + Location & settings ── */}
            {(hasLocation || hasPreferences) && (
                <div className={cn("grid gap-6", hasLocation && hasPreferences ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                    {hasPreferences && (
                        <Section title="Preferences" className="grid-cols-1">
                            <div className="space-y-1.5">
                                {formatPreferences(fullUser.preferences ?? {}).map(({ label, value }) => (
                                    <div key={label} className="flex justify-between gap-3">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                                            {label}
                                        </span>
                                        <span className="text-sm text-foreground shrink-0">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                    {hasLocation && (
                        <Section title="Location & settings" className="grid-cols-1">
                            {locationStr && <Row label="Location" value={locationStr} />}
                            {fullUser.timezone && <Row label="Timezone" value={fullUser.timezone} />}
                            {fullUser.preferredCurrency && (
                                <Row label="Currency" value={fullUser.preferredCurrency} />
                            )}
                        </Section>
                    )}
                </div>
            )}

            {/* ── About ── */}
            {fullUser && (fullUser.tagline || fullUser.bio) && (
                <Section title="About">
                    {fullUser.tagline && <Row label="Tagline" value={fullUser.tagline} />}
                    {fullUser.bio && (
                        <div className="col-span-2">
                            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
                                Bio
                            </span>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {fullUser.bio}
                            </p>
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}
