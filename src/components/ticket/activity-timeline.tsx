import { ArrowRight, CirclePlus } from "lucide-react";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { UserAvatar } from "@/components/user-avatar";
import type { Priority, Status, TicketType } from "@/lib/constants";
import { formatDateTime, formatDueDate, timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/server/comments";

type ChangeItem = Extract<ActivityItem, { kind: "change" }>;

function When({ date }: { date: Date }) {
  return (
    <time dateTime={date.toISOString()} title={formatDateTime(date)} className="text-xs whitespace-nowrap text-muted-foreground">
      {timeAgo(date)}
    </time>
  );
}

function Transition({ from, to }: { from: React.ReactNode; to: React.ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-middle">
      {from}
      <ArrowRight className="size-3 text-muted-foreground" aria-label="to" />
      {to}
    </span>
  );
}

function describe(change: ChangeItem, names: Map<string, string>): React.ReactNode {
  const { field, oldValue, newValue } = change;
  const person = (id: string | null) => (id ? (names.get(id) ?? "a former user") : null);
  switch (field) {
    case "status":
      return <>changed status <Transition from={<StatusBadge status={oldValue as Status} />} to={<StatusBadge status={newValue as Status} />} /></>;
    case "priority":
      return <>changed priority <Transition from={<PriorityBadge priority={oldValue as Priority} />} to={<PriorityBadge priority={newValue as Priority} />} /></>;
    case "type":
      return <>changed type <Transition from={<TypeBadge type={oldValue as TicketType} />} to={<TypeBadge type={newValue as TicketType} />} /></>;
    case "assignee_id":
      if (!newValue) return <>unassigned <strong className="font-medium text-foreground">{person(oldValue)}</strong></>;
      if (!oldValue) return <>assigned <strong className="font-medium text-foreground">{person(newValue)}</strong></>;
      return <>reassigned from <strong className="font-medium text-foreground">{person(oldValue)}</strong> to <strong className="font-medium text-foreground">{person(newValue)}</strong></>;
    case "due_date":
      if (!newValue) return <>cleared the due date</>;
      return <>set the due date to <strong className="font-medium text-foreground">{formatDueDate(newValue)}</strong></>;
    case "title":
      return <>renamed this from <span className="text-foreground line-through decoration-muted-foreground/50">{oldValue}</span></>;
    case "description":
      return <>edited the description</>;
    default:
      return null; // derived fields such as closed_at aren't shown
  }
}

export function ActivityTimeline({
  items,
  names,
  created,
}: {
  items: ActivityItem[];
  names: Map<string, string>;
  created: { at: Date; by: { id: string; name: string } };
}) {
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-3 before:w-px before:bg-border">
      <li className="relative flex items-center gap-3 text-sm text-muted-foreground">
        <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-background">
          <CirclePlus className="size-4 text-primary" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <strong className="font-medium text-foreground">{created.by.name}</strong> opened this ticket
        </span>
        <span className="ml-auto"><When date={created.at} /></span>
      </li>
      {items.map((item) => {
        if (item.kind === "comment") {
          return (
            <li key={item.id} className="relative flex gap-3">
              <UserAvatar user={item.user} className="relative z-10 mt-1 ring-4 ring-background" />
              <article className="min-w-0 flex-1 rounded-xl border bg-card shadow-xs">
                <header className="flex items-center gap-2 border-b px-3 py-2 text-sm">
                  <strong className="font-medium">{item.user.name}</strong>
                  <span className="text-muted-foreground">commented</span>
                  <span className="ml-auto"><When date={item.createdAt} /></span>
                </header>
                <div className="px-3 py-2.5">
                  <Markdown>{item.body}</Markdown>
                </div>
              </article>
            </li>
          );
        }
        const text = describe(item, names);
        if (!text) return null;
        return (
          <li key={item.id} className="relative flex items-center gap-3 text-sm text-muted-foreground">
            <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-background">
              <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            </span>
            <span className="min-w-0 leading-6">
              <strong className="font-medium text-foreground">{item.user.name}</strong> {text}
            </span>
            <span className="ml-auto self-start pt-0.5"><When date={item.createdAt} /></span>
          </li>
        );
      })}
    </ol>
  );
}
