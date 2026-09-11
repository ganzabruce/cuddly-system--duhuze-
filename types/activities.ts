import { z } from "zod";

export const activitySchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    timestamp: z.date(),
    details: z.string(),
    icon: z.string(),
});

export type Activity = z.infer<typeof activitySchema>;
