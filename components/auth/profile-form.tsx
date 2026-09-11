"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CameraIcon } from "@heroicons/react/24/outline";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import logger from "@/lib/utils/logger";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/storage/client";
import { updateProfileImageAction, updateProfileAction } from "@/actions/auth/actions";
import type { OrganizerProfile } from "@/types/auth";
import { getAppDisplayHost } from "@/lib/utils/url";
import { getPublicProfilePath } from "@/lib/constants/events/profile-paths";

const baseUrl = getAppDisplayHost();
type Socials = NonNullable<OrganizerProfile["socials"]>;

export interface OrganizerProfileFormProps {
    initialProfile: OrganizerProfile;
}

export function OrganizerProfileForm({
    initialProfile,
}: OrganizerProfileFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [displayName, setDisplayName] = useState(initialProfile.name);
    const [username, setUsername] = useState(initialProfile.username ?? "");
    const [tagline, setTagline] = useState(initialProfile.tagline ?? "");
    const [bio, setBio] = useState(initialProfile.bio ?? "");
    const [websiteUrl, setWebsiteUrl] = useState(
        initialProfile.websiteUrl ?? "",
    );
    const [publicEmail, setPublicEmail] = useState(
        initialProfile.publicEmail ?? initialProfile.email,
    );
    const [phoneNumber, setPhoneNumber] = useState(
        initialProfile.phoneNumber ?? "",
    );

    const socials = (initialProfile.socials as Socials | null) ?? null;
    const [instagram, setInstagram] = useState(socials?.instagram ?? "");
    const [linkedin, setLinkedin] = useState(socials?.linkedin ?? "");
    const [xUrl, setXUrl] = useState(socials?.x ?? "");
    const [customLink, setCustomLink] = useState(socials?.custom ?? "");

    // ── Profile image state ──
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
        initialProfile.profileImageUrl ?? null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { startUpload } = useUploadThing("profileImage", {
        onClientUploadComplete: (res) => {
            const url = res?.[0]?.url as string | undefined;
            if (url) {
                setProfileImageUrl(url);
                updateProfileImageAction(url);
            }
            setIsUploading(false);
        },
        onUploadError: () => {
            setIsUploading(false);
            toast.error("Failed to upload image. Please try again.");
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        startUpload([file]);
        e.target.value = "";
    };

    const handleRemovePhoto = () => {
        setProfileImageUrl(null);
        updateProfileImageAction(null);
    };

    const previewUsername = username.trim() || "username";
    const previewProfileUrl = `${baseUrl}${getPublicProfilePath(previewUsername)}`;
    const previewContacts = [
        websiteUrl.trim() && {
            label: "Website",
            value: websiteUrl.trim(),
        },
        publicEmail.trim() && {
            label: "Email",
            value: publicEmail.trim(),
        },
        phoneNumber.trim() && {
            label: "Phone",
            value: phoneNumber.trim(),
        },
        instagram.trim() && {
            label: "Instagram",
            value: instagram.trim(),
        },
        linkedin.trim() && {
            label: "LinkedIn",
            value: linkedin.trim(),
        },
        xUrl.trim() && {
            label: "X",
            value: xUrl.trim(),
        },
        customLink.trim() && {
            label: "Link",
            value: customLink.trim(),
        },
    ].filter(Boolean) as Array<{ label: string; value: string }>;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            const payload = {
                displayName: displayName.trim(),
                username: username.trim(),
                tagline: tagline.trim() || undefined,
                bio: bio.trim() || undefined,
                websiteUrl: websiteUrl.trim() || undefined,
                publicEmail: publicEmail.trim() || undefined,
                phoneNumber: phoneNumber.trim() || undefined,
                socials: {
                    instagram: instagram.trim() || undefined,
                    linkedin: linkedin.trim() || undefined,
                    x: xUrl.trim() || undefined,
                    custom: customLink.trim() || undefined,
                },
                profileImageUrl: profileImageUrl ?? undefined,
                coverImageUrl: initialProfile.coverImageUrl ?? undefined,
            };

            const result = await updateProfileAction(payload);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Profile updated.");
            router.refresh();
        } catch (error) {
            logger.error("Failed to update profile", error);
            toast.error(
                "Something went wrong while saving your profile. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    const sectionCard =
        "rounded-md border border-border bg-card p-4 sm:p-5 space-y-3";

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6"
        >
            {/* Left: form sections */}
            <div className="flex flex-col gap-4 xl:col-span-2 xl:gap-6">
                {/* Profile identity */}
                <section className={sectionCard}>
                    <h2 className="text-sm font-semibold text-foreground">
                        Profile
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        This is how your name and handle appear on your public
                        organizer page.
                    </p>
                    {/* Profile photo */}
                    <div className="mt-4 flex items-center gap-3 border-b border-border pb-4 sm:gap-4">
                        <div className="relative shrink-0">
                            <Avatar className="size-16">
                                <AvatarImage
                                    src={profileImageUrl ?? undefined}
                                    alt={initialProfile.name}
                                />
                                <AvatarFallback className="text-lg">
                                    {(initialProfile.name?.charAt(0) ?? initialProfile.email?.charAt(0) ?? "?").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{initialProfile.name}</p>
                            <p className="text-xs text-muted-foreground">{initialProfile.email}</p>
                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <CameraIcon className="mr-1.5 h-4 w-4" />
                                    Change photo
                                </Button>
                                {profileImageUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemovePhoto}
                                        disabled={isUploading}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        Remove
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="displayName">Display name</Label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) =>
                                    setDisplayName(e.target.value)
                                }
                                required
                                maxLength={255}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="username">
                                Username / handle
                            </Label>
                            <div className="flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3">
                                <span
                                    className="max-w-[60%] shrink truncate text-xs text-muted-foreground opacity-75"
                                    title={`${baseUrl}/u/`}
                                >
                                    {baseUrl}/u/
                                </span>
                                <input
                                    id="username"
                                    className={cn(
                                        "min-w-0 flex-1 bg-transparent px-1 text-sm outline-none",
                                    )}
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Lowercase letters, numbers, and dashes only.
                                Used in your profile and event URLs.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                            id="tagline"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            maxLength={160}
                            placeholder="Short one-liner about your events..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional. Shown near your name on your public
                            profile.
                        </p>
                    </div>
                    <div className="mt-3 space-y-2">
                        <Label htmlFor="bio">About / bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="Tell guests a bit more about you and the experiences you host..."
                        />
                        <p className="text-xs text-muted-foreground">
                            You can share your style, themes you like, or what
                            guests can expect.
                        </p>
                    </div>
                </section>

                {/* Contact + socials */}
                <section className={sectionCard}>
                    <h2 className="text-sm font-semibold text-foreground">
                        Contact & socials
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        How guests can reach you and follow your work.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="publicEmail">Contact email</Label>
                            <Input
                                id="publicEmail"
                                type="email"
                                value={publicEmail}
                                onChange={(e) =>
                                    setPublicEmail(e.target.value)
                                }
                                placeholder={initialProfile.email}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phoneNumber">Phone (optional)</Label>
                            <PhoneInput
                                id="phoneNumber"
                                defaultValue={phoneNumber}
                                onChange={setPhoneNumber}
                            />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <Label htmlFor="websiteUrl">Website (optional)</Label>
                        <Input
                            id="websiteUrl"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://your-site.com"
                        />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                                id="instagram"
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                                id="linkedin"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="xUrl">X (formerly Twitter)</Label>
                            <Input
                                id="xUrl"
                                value={xUrl}
                                onChange={(e) => setXUrl(e.target.value)}
                                placeholder="https://x.com/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="customLink">Custom link</Label>
                            <Input
                                id="customLink"
                                value={customLink}
                                onChange={(e) => setCustomLink(e.target.value)}
                                placeholder="Another important link"
                            />
                        </div>
                    </div>
                </section>

            </div>

            {/* Right: simple preview */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                <section className={sectionCard}>
                    <h2 className="text-sm font-semibold text-foreground">
                        Public profile preview
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Approximate preview of how guests will see your
                        organizer profile.
                    </p>
                    <div className="mt-4 overflow-hidden rounded-md border border-border bg-background">
                        <div className="border-b border-border bg-muted/40 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Live preview
                            </p>
                        </div>
                        <div className="space-y-3 p-3">
                            <div className="space-y-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {displayName || "Your name"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    @{previewUsername}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {previewProfileUrl}
                                </p>
                            </div>

                            {tagline && (
                                <p className="text-xs text-foreground/90">{tagline}</p>
                            )}

                            <p className="text-xs text-muted-foreground line-clamp-4">
                                {bio ||
                                    "Event organizer on Duhuze RSVP. Discover upcoming events and RSVP."}
                            </p>

                            {previewContacts.length > 0 && (
                                <div className="space-y-1 border-t border-border pt-3">
                                    {previewContacts.slice(0, 3).map((item) => (
                                        <p
                                            key={`${item.label}-${item.value}`}
                                            className="truncate text-xs text-muted-foreground"
                                        >
                                            <span className="text-foreground/80">
                                                {item.label}: 
                                            </span>
                                            {item.value}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="mt-2 flex flex-col gap-3">
                    <Button type="submit" disabled={saving} size="lg">
                        {saving ? "Saving..." : "Save profile"}
                    </Button>
                </div>
            </aside>
        </form>
    );
}
