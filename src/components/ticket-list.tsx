import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { PriorityBadge, StatusBadge, TYPE_META } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { FINISHED_STATUSES, TYPE_LABELS } from "@/lib/constants";
import { formatDueDate, isOverdue, timeAgo } from "@/lib/format";
import { ticketKey } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import type { TicketListRow } from "@/server/tickets";

export function TicketList({
  tickets,
  compact = false,
  className,
}: {
  tickets: TicketListRow[];
  /** Compact rows drop the priority and due columns (used on the dashboard). */
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y overflow-hidden rounded-xl border bg-card", className)}>
      {tickets.map((t) => {
        const key = ticketKey(t.projectKey, t.number);
        const TypeIcon = TYPE_META[t.type].icon;
        const overdue = isOverdue(t.dueDate, FINISHED_STATUSES.includes(t.status));
        return (
          <li key={t.id}>
            <Link
              href={`/tickets/${key}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2.5 text-sm transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4 md:grid-cols-[4.5rem_1fr_auto_auto_auto] md:gap-y-0"
            >
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <TypeIcon className="size-3.5 shrink-0" aria-label={TYPE_LABELS[t.type]} />
                {key}
              </span>
              <span className="min-w-0 truncate font-medium group-hover:text-foreground">{t.title}</span>
              <span className="flex items-center gap-2 justify-self-end md:order-last">
                <span className="hidden text-xs whitespace-nowrap text-muted-foreground lg:inline" title={t.updatedAt.toISOString()}>
                  {timeAgo(t.updatedAt)}
                </span>
                <UserAvatar user={t.assigneeId ? { id: t.assigneeId, name: t.assigneeName ?? "" } : null} />
                <span className="sr-only">
                  {t.assigneeName ? `Assigned to ${t.assigneeName}` : "Unassigned"}
                </span>
              </span>
              <span className="col-span-3 flex flex-wrap items-center gap-1.5 md:col-span-1 md:justify-self-end">
                <StatusBadge status={t.status} />
                {!compact && <PriorityBadge priority={t.priority} />}
                {compact && t.priority === "urgent" && <PriorityBadge priority="urgent" />}
              </span>
              <span className="hidden w-20 justify-self-end text-xs md:block">
                {t.dueDate && !compact && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground",
                      overdue && "font-medium text-terracotta",
                    )}
                  >
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">{overdue ? "Overdue, due" : "Due"}</span>
                    {formatDueDate(t.dueDate)}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
