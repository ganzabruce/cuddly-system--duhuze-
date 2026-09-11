"use client";

import type { ComponentType, SVGProps } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GuestBulkActionItem = {
    key: string;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    onSelect: () => void;
    disabled?: boolean;
    destructive?: boolean;
    separatorBefore?: boolean;
};

type GuestBulkActionsMenuProps = {
    items: GuestBulkActionItem[];
};

export function GuestBulkActionsMenu({
    items,
}: GuestBulkActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2"
                    />
                }
            >
                Actions
                <ChevronDownIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.key}>
                            {item.separatorBefore ? <DropdownMenuSeparator /> : null}
                            <DropdownMenuItem
                                className={
                                    item.destructive
                                        ? "gap-2 p-2 text-destructive focus:text-destructive"
                                        : "gap-2 p-2"
                                }
                                onClick={item.onSelect}
                                disabled={item.disabled}
                            >
                                <Icon
                                    className={
                                        item.destructive
                                            ? "size-4 shrink-0 text-destructive"
                                            : "size-4 shrink-0 text-muted-foreground"
                                    }
                                />
                                {item.label}
                            </DropdownMenuItem>
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
