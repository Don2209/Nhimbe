"use client";

import { CalendarClock, UserCheck } from "lucide-react";
import { PriorityBadge, STATUS_META, StatusBadge, TypeBadge } from "@/components/badges";
import { PropertyPicker } from "@/components/ticket/property-picker";
import { useTicketPatch } from "@/components/ticket/use-ticket-patch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import {
  FINISHED_STATUSES,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  TICKET_TYPES,
  TYPE_LABELS,
  type Priority,
  type Status,
  type TicketType,
} from "@/lib/constants";
import { isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";

type Values = {
  status: Status;
  priority: Priority;
  type: TicketType;
  assigneeId: string | null;
  dueDate: string | null;
};

type UserOption = { id: string; name: string };

const DoneIcon = STATUS_META.done.icon;

const statusOptions = STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
  render: <StatusBadge status={s} />,
}));
const priorityOptions = PRIORITIES.map((p) => ({
  value: p,
  label: PRIORITY_LABELS[p],
  render: <PriorityBadge priority={p} />,
}));
const typeOptions = TICKET_TYPES.map((t) => ({
  value: t,
  label: TYPE_LABELS[t],
  render: <TypeBadge type={t} />,
}));

function assigneeOptions(users: UserOption[]) {
  return [
    {
      value: "none",
      label: "Unassigned",
      render: (
        <span className="flex items-center gap-2 text-muted-foreground">
          <UserAvatar user={null} className="size-5" /> Unassigned
        </span>
      ),
    },
    ...users.map((u) => ({
      value: u.id,
      label: u.name,
      render: (
        <span className="flex items-center gap-2">
          <UserAvatar user={u} className="size-5" /> {u.name}
        </span>
      ),
    })),
  ];
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-center gap-2 py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Status + assignee, editable right under the ticket title. */
export function QuickBar({
  ticketId,
  values: initial,
  users,
  currentUserId,
}: {
  ticketId: string;
  values: Values;
  users: UserOption[];
  currentUserId: string;
}) {
  const { values, save } = useTicketPatch(ticketId, initial);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <PropertyPicker
        label="Status"
        value={values.status}
        options={statusOptions}
        onChange={(v) => save({ status: v as Status })}
      />
      <PropertyPicker
        label="Assignee"
        value={values.assigneeId ?? "none"}
        options={assigneeOptions(users)}
        onChange={(v) => save({ assigneeId: v === "none" ? null : v })}
      />
      {values.assigneeId !== currentUserId && (
        <Button variant="ghost" size="sm" onClick={() => save({ assigneeId: currentUserId }, "Assigned to you")}>
          <UserCheck aria-hidden="true" /> Assign to me
        </Button>
      )}
      {!FINISHED_STATUSES.includes(values.status) && (
        <Button variant="ghost" size="sm" onClick={() => save({ status: "done" }, "Marked as done")}>
          <DoneIcon className="text-status-done" aria-hidden="true" />
          Mark done
        </Button>
      )}
    </div>
  );
}

export function TicketProperties({
  ticketId,
  values: initial,
  users,
  meta,
}: {
  ticketId: string;
  values: Values;
  users: UserOption[];
  meta: { label: string; value: React.ReactNode }[];
}) {
  const { values, save } = useTicketPatch(ticketId, initial);
  const overdue = isOverdue(values.dueDate, FINISHED_STATUSES.includes(values.status));

  return (
    <dl className="divide-y-0">
      <Row label="Status">
        <PropertyPicker label="Status" value={values.status} options={statusOptions} onChange={(v) => save({ status: v as Status })} />
      </Row>
      <Row label="Priority">
        <PropertyPicker label="Priority" value={values.priority} options={priorityOptions} onChange={(v) => save({ priority: v as Priority })} />
      </Row>
      <Row label="Type">
        <PropertyPicker label="Type" value={values.type} options={typeOptions} onChange={(v) => save({ type: v as TicketType })} />
      </Row>
      <Row label="Assignee">
        <PropertyPicker
          label="Assignee"
          value={values.assigneeId ?? "none"}
          options={assigneeOptions(users)}
          onChange={(v) => save({ assigneeId: v === "none" ? null : v })}
        />
      </Row>
      <Row label="Due date">
        <div className="flex items-center gap-1.5 px-1.5">
          <CalendarClock className={cn("size-4 shrink-0 text-muted-foreground", overdue && "text-terracotta")} aria-hidden="true" />
          <Input
            type="date"
            aria-label={overdue ? "Due date (overdue)" : "Due date"}
            defaultValue={values.dueDate ?? ""}
            key={values.dueDate ?? ""}
            onBlur={(e) => {
              const next = e.target.value || null;
              if (next !== values.dueDate) save({ dueDate: next });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className={cn("h-7 border-transparent bg-transparent px-1 shadow-none hover:border-input dark:bg-transparent", overdue && "text-terracotta")}
          />
        </div>
      </Row>
      {meta.map((m) => (
        <Row key={m.label} label={m.label}>
          <div className="px-1.5 text-sm">{m.value}</div>
        </Row>
      ))}
    </dl>
  );
}

