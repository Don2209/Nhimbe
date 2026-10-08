export const ROLES = ["developer", "admin"] as const;
export const TICKET_TYPES = ["bug", "task", "feature", "support"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const STATUSES = ["open", "in_progress", "in_review", "done", "closed"] as const;

export type Role = (typeof ROLES)[number];
export type TicketType = (typeof TICKET_TYPES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TYPE_LABELS: Record<TicketType, string> = {
  bug: "Bug",
  task: "Task",
  feature: "Feature",
  support: "Support",
};

/** Statuses that count as finished: entering one sets closed_at. */
export const FINISHED_STATUSES: readonly Status[] = ["done", "closed"];

export const PAGE_SIZE = 25;
