"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
    ArrowRightStartOnRectangleIcon,
    ArrowTopRightOnSquareIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";

import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavErrorBoundary } from "@/components/layout/nav-error-boundary";
import { getPublicProfilePath } from "@/lib/constants/events/profile-paths";

export interface UserMenuProps {
    name: string;
    email: string;
    profileUsername?: string | null;
    profileImageUrl?: string | null;
    sidebarMode?: boolean;
    triggerClassName?: string;
}

export function UserMenu({ name, email, profileUsername = null, profileImageUrl = null, sidebarMode = false, triggerClassName }: UserMenuProps) {
    const { signOut } = useClerk();
    const router = useRouter();
    const isMobile = useIsMobile();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const itemIconClassName = "size-4 shrink-0 text-muted-foreground";
    const profileHref = profileUsername
        ? getPublicProfilePath(profileUsername)
        : "/onboarding";
    const display = {
        name: name || "User",
        email,
        avatar: profileImageUrl || "",
        initial: name.charAt(0) || "U",
    };

    const trigger = sidebarMode ? (
        <button
            type="button"
            className={triggerClassName}
        >
            <Avatar className="h-8 w-8 shrink-0 rounded-md">
                <AvatarImage src={display.avatar} alt={display.name} />
                <AvatarFallback className="rounded-md text-xs font-semibold">
                    {display.initial}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    {display.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {display.email}
                </p>
            </div>
        </button>
    ) : (
        <button
            type="button"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border hover:border-accent/50 transition-colors"
        >
            <Avatar className="h-8 w-8">
                <AvatarImage src={display.avatar} alt={display.name} />
                <AvatarFallback className="rounded-full">
                    {display.initial}
                </AvatarFallback>
            </Avatar>
        </button>
    );

    return (
        <NavErrorBoundary>
            <DropdownMenu>
                <DropdownMenuTrigger render={trigger} />
                <DropdownMenuContent
                    className="min-w-56 rounded-md border-border bg-background"
                    side={sidebarMode ? (isMobile ? "top" : "right") : "bottom"}
                    align={sidebarMode ? "start" : "end"}
                    sideOffset={8}
                >
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-md">
                                    <AvatarImage src={display.avatar} alt={display.name} />
                                    <AvatarFallback className="rounded-md">
                                        {display.initial}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{display.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{display.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem render={<Link href="/app/profile" />} className="cursor-pointer gap-2 p-2">
                            <UserCircleIcon className={itemIconClassName} />
                            <span>Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/app/settings" />} className="cursor-pointer gap-2 p-2">
                            <Cog6ToothIcon className={itemIconClassName} />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/app/billing" />} className="cursor-pointer gap-2 p-2">
                            <CreditCardIcon className={itemIconClassName} />
                            <span>Billing</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem render={<Link href={profileHref} target="_blank" rel="noopener noreferrer" />} className="cursor-pointer gap-2 p-2">
                            <ArrowTopRightOnSquareIcon className={itemIconClassName} />
                            <span>{profileUsername ? "Public profile" : "Set up a Username"}</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 p-2">
                        <ArrowRightStartOnRectangleIcon className="size-4 shrink-0 text-destructive" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </NavErrorBoundary>
    );
}
