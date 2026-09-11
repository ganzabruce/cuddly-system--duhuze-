import type { RsvpConfirmationContent } from "@/lib/email/types";
import { rsvpConfirmationYesHtml } from "./RsvpYesEmail";
import { rsvpConfirmationMaybeHtml } from "./RsvpMaybeEmail";
import { rsvpConfirmationNoHtml } from "./RsvpNoEmail";

const renderers: Record<"yes" | "no" | "maybe", (params: RsvpConfirmationContent) => string> = {
    yes: rsvpConfirmationYesHtml,
    maybe: rsvpConfirmationMaybeHtml,
    no: rsvpConfirmationNoHtml,
};

export function rsvpConfirmationEmailHtml(params: RsvpConfirmationContent): string {
    return renderers[params.rsvpStatus](params);
}
