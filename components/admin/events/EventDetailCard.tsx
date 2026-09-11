import {
    CalendarDaysIcon,
    UserIcon,
    EyeIcon,
    EyeSlashIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import type { EventWithStats } from "@/types/admin";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants/events/constants";

type EventDetailCardProps = {
    event: EventWithStats;
};

export function EventDetailCard({ event }: EventDetailCardProps) {
    return (
        <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">Event Details</h2>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Title</div>
                        <div className="text-base text-foreground">{event.title}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Category</div>
                        <div className="text-base text-foreground">
                            {event.category
                                ? EVENT_CATEGORY_LABELS[event.category] ?? event.category
                                : "Uncategorized"}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Date</div>
                        <div className="text-base text-foreground">
                            {new Date(event.date).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    {event.visibility === "public" ? (
                        <EyeIcon className="h-5 w-5 text-success mt-0.5" />
                    ) : (
                        <EyeSlashIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Visibility</div>
                        <div className="text-base text-foreground">
                            <Badge variant={event.visibility === "public" ? "primary" : "secondary"}>
                                {event.visibility === "public" ? "Public" : "Private"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Organizer</div>
                        <div className="text-base text-foreground">{event.organizerName}</div>
                        {event.organizerUsername && (
                            <div className="text-sm text-muted-foreground">@{event.organizerUsername}</div>
                        )}
                        <div className="text-sm text-muted-foreground">{event.organizerEmail}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Guest Count</div>
                        <div className="text-base text-foreground">{event.guestCount}</div>
                    </div>
                </div>

                {event.createdAt && (
                    <div className="flex items-start gap-3">
                        <CalendarDaysIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Created At</div>
                            <div className="text-base text-foreground">
                                {new Date(event.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
