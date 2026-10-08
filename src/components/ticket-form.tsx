"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import {
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

export type TicketFormValues = {
  id?: string;
  key?: string;
  projectId: string;
  title: string;
  description: string;
  type: TicketType;
  priority: Priority;
  status: Status;
  assigneeId: string | null;
  dueDate: string | null;
};

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {errors[0]}
    </p>
  );
}

export function TicketForm({
  action,
  initial,
  projects,
  users,
  mode,
  cancelHref,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial: TicketFormValues;
  projects: { id: string; key: string; name: string }[];
  users: { id: string; name: string }[];
  mode: "create" | "edit";
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: true });
  const errors = state.ok ? undefined : state.fieldErrors;
  const invalid = (name: string) =>
    errors?.[name]?.length ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {initial.key && <input type="hidden" name="key" value={initial.key} />}

      <div className="grid gap-5 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              autoFocus={mode === "create"}
              defaultValue={initial.title}
              placeholder="What needs doing?"
              className="h-10 bg-card text-base"
              {...invalid("title")}
            />
            <FieldError id="title-error" errors={errors?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MarkdownEditor
              id="description"
              name="description"
              defaultValue={initial.description}
              placeholder="Context, steps to reproduce, acceptance criteria… Markdown is supported."
              rows={12}
              {...invalid("description")}
            />
            <FieldError id="description-error" errors={errors?.description} />
          </div>
        </div>

        <fieldset className="space-y-4 rounded-xl border bg-card p-4 lg:self-start">
          <legend className="sr-only">Ticket properties</legend>
          <div className="space-y-1.5">
            <Label htmlFor="projectId">Project</Label>
            {mode === "create" ? (
              <NativeSelect id="projectId" name="projectId" defaultValue={initial.projectId} required {...invalid("projectId")}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} · {p.name}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <p id="projectId" className="flex h-9 items-center text-sm text-muted-foreground">
                {projects.find((p) => p.id === initial.projectId)?.name ?? "—"}
                <span className="ml-1 font-mono text-xs">({initial.key})</span>
              </p>
            )}
            <FieldError id="projectId-error" errors={errors?.projectId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <NativeSelect id="type" name="type" defaultValue={initial.type}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <NativeSelect id="priority" name="priority" defaultValue={initial.priority}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <NativeSelect id="status" name="status" defaultValue={initial.status}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assigneeId">Assignee</Label>
            <NativeSelect id="assigneeId" name="assigneeId" defaultValue={initial.assigneeId ?? ""} {...invalid("assigneeId")}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </NativeSelect>
            <FieldError id="assigneeId-error" errors={errors?.assigneeId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={initial.dueDate ?? ""}
              className="h-9 bg-card"
              {...invalid("dueDate")}
            />
            <FieldError id="dueDate-error" errors={errors?.dueDate} />
          </div>
        </fieldset>
      </div>

      {!state.ok && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" nativeButton={false} render={<Link href={cancelHref} />}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {mode === "create" ? "Create ticket" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
