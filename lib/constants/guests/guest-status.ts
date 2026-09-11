import type { RsvpStatus } from "@/types/rsvp";

export type RsvpStatusOption = {
    value: RsvpStatus | "pending";
    label: string;
};

export const STATUS_OPTIONS: RsvpStatusOption[] = [
    { value: "pending", label: "Pending" },
    { value: "yes", label: "Attending" },
    { value: "maybe", label: "Maybe" },
    { value: "no", label: "Not Attending" },
];

export const STATUS_LABELS: Record<RsvpStatusOption["value"], string> = {
    pending: "Pending",
    yes: "Attending",
    maybe: "Maybe",
    no: "Not Attending",
};

/** Semantic badge styles per RSVP status */
export const STATUS_BADGE_CLASSES: Record<RsvpStatus, string> = {
    yes: "bg-success/15 text-success",
    maybe: "bg-warning/15 text-warning",
    no: "bg-destructive/15 text-destructive",
};

export const PENDING_BADGE_CLASSES =
    "bg-muted text-muted-foreground";

export const INVITED_BADGE_CLASSES =
    "bg-primary/12 text-primary";

export const NOT_INVITED_BADGE_CLASSES =
    "bg-muted text-muted-foreground";

export const getStatusLabel = (
    status: RsvpStatusOption["value"] | null | undefined,
): string => {
    if (!status) {
        return STATUS_LABELS.pending;
    }

    return STATUS_LABELS[status] ?? STATUS_LABELS.pending;
};
