export const EVENT_STATUS_OPTIONS = [
  {
    value: "draft",
    title: "Draft",
    description: "Work in progress, not visible publicly",
  },
  {
    value: "published",
    title: "Published",
    description: "Visible to guests based on visibility",
  },
  {
    value: "completed",
    title: "Completed",
    description: "Event has ended",
  },
  {
    value: "cancelled",
    title: "Cancelled",
    description: "Event is cancelled",
  },
] as const;
