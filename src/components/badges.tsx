import {
  Bug,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleMinus,
  Eye,
  Flame,
  LifeBuoy,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sparkles,
  SquareCheck,
  type LucideIcon,
} from "lucide-react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  type Priority,
  type Status,
  type TicketType,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Meta = { icon: LucideIcon; className: string };

// Full class strings (not interpolated) so Tailwind can see them.
export const STATUS_META: Record<Status, Meta> = {
  open: { icon: CircleDashed, className: "text-status-open bg-status-open/10 ring-status-open/20" },
  in_progress: { icon: CircleDot, className: "text-status-in-progress bg-status-in-progress/12 ring-status-in-progress/25" },
  in_review: { icon: Eye, className: "text-status-in-review bg-status-in-review/12 ring-status-in-review/25" },
  done: { icon: CircleCheck, className: "text-status-done bg-status-done/12 ring-status-done/25" },
  closed: { icon: CircleMinus, className: "text-status-closed bg-status-closed/10 ring-status-closed/20" },
};

export const PRIORITY_META: Record<Priority, Meta> = {
  low: { icon: SignalLow, className: "text-priority-low bg-priority-low/10 ring-priority-low/20" },
  medium: { icon: SignalMedium, className: "text-priority-medium bg-priority-medium/10 ring-priority-medium/20" },
  high: { icon: SignalHigh, className: "text-priority-high bg-priority-high/12 ring-priority-high/25" },
  urgent: { icon: Flame, className: "text-priority-urgent bg-priority-urgent/12 ring-priority-urgent/30" },
};

export const TYPE_META: Record<TicketType, { icon: LucideIcon }> = {
  bug: { icon: Bug },
  task: { icon: SquareCheck },
  feature: { icon: Sparkles },
  support: { icon: LifeBuoy },
};

const base =
  "inline-flex h-5.5 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3.5";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_META[status];
  return (
    <span className={cn(base, tone, className)}>
      <Icon aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { icon: Icon, className: tone } = PRIORITY_META[priority];
  return (
    <span className={cn(base, tone, className)}>
      <Icon aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function TypeBadge({ type, className }: { type: TicketType; className?: string }) {
  const { icon: Icon } = TYPE_META[type];
  return (
    <span className={cn(base, "bg-muted text-muted-foreground ring-border", className)}>
      <Icon aria-hidden="true" />
      {TYPE_LABELS[type]}
    </span>
  );
}

/** Icon-only status marker; always paired with a visually hidden label. */
export function StatusIcon({ status, className }: { status: Status; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_META[status];
  return (
    <span className={cn("inline-flex", tone.split(" ")[0], className)} title={STATUS_LABELS[status]}>
      <Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{STATUS_LABELS[status]}</span>
    </span>
  );
}
