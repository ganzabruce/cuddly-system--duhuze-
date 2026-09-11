import type { RsvpUpdateContent } from "@/lib/email/types";
import { rsvpUpdateYesHtml } from "./RsvpYesEmail";
import { rsvpUpdateMaybeHtml } from "./RsvpMaybeEmail";
import { rsvpUpdateNoHtml } from "./RsvpNoEmail";

const renderers: Record<"yes" | "no" | "maybe", (params: RsvpUpdateContent) => string> = {
    yes: rsvpUpdateYesHtml,
    maybe: rsvpUpdateMaybeHtml,
    no: rsvpUpdateNoHtml,
};

export function rsvpUpdateEmailHtml(params: RsvpUpdateContent): string {
    return renderers[params.rsvpStatus](params);
}
