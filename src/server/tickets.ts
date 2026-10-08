import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, type Tx } from "@/db";
import { projects, ticketHistory, tickets, users, type Ticket } from "@/db/schema";
import { ActionError } from "@/lib/action-result";
import { FINISHED_STATUSES, PAGE_SIZE, type Status } from "@/lib/constants";
import { parseTicketKey } from "@/lib/tickets";
import type { TicketCreateInput, TicketFilters, TicketPatch } from "@/lib/validation";

const assignee = alias(users, "assignee");
const reporter = alias(users, "reporter");

const listColumns = {
  id: tickets.id,
  number: tickets.number,
  projectKey: projects.key,
  title: tickets.title,
  status: tickets.status,
  priority: tickets.priority,
  type: tickets.type,
  dueDate: tickets.dueDate,
  createdAt: tickets.createdAt,
  updatedAt: tickets.updatedAt,
  assigneeId: tickets.assigneeId,
  assigneeName: assignee.name,
};

export type TicketListRow = {
  id: string;
  number: number;
  projectKey: string;
  title: string;
  status: Ticket["status"];
  priority: Ticket["priority"];
  type: Ticket["type"];
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  assigneeId: string | null;
  assigneeName: string | null;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Matches title or description text, or an exact key like "PAY-12". */
function textSearch(q: string): SQL {
  const pattern = `%${escapeLike(q)}%`;
  const parts: SQL[] = [ilike(tickets.title, pattern), ilike(tickets.description, pattern)];
  const key = parseTicketKey(q);
  if (key) {
    parts.push(and(eq(projects.key, key.projectKey), eq(tickets.number, key.number))!);
  }
  return or(...parts)!;
}

function filterConditions(f: TicketFilters, currentUserId: string) {
  const conds: SQL[] = [];
  if (f.status.length) conds.push(inArray(tickets.status, f.status));
  if (f.priority.length) conds.push(inArray(tickets.priority, f.priority));
  if (f.type.length) conds.push(inArray(tickets.type, f.type));
  if (f.project.length) conds.push(inArray(projects.key, f.project));
  if (f.assignee.length) {
    const ids = f.assignee
      .filter((a) => a !== "none")
      .map((a) => (a === "me" ? currentUserId : a));
    const parts: SQL[] = [];
    if (ids.length) parts.push(inArray(tickets.assigneeId, ids));
    if (f.assignee.includes("none")) parts.push(isNull(tickets.assigneeId));
    conds.push(or(...parts)!);
  }
  if (f.q) conds.push(textSearch(f.q));
  return conds.length ? and(...conds) : undefined;
}

const sortColumns = {
  updated: tickets.updatedAt,
  created: tickets.createdAt,
  priority: tickets.priority, // enum order: low < medium < high < urgent
  status: tickets.status,
  due: tickets.dueDate,
  number: tickets.number,
  title: tickets.title,
} as const;

export async function listTickets(f: TicketFilters, currentUserId: string) {
  const where = filterConditions(f, currentUserId);
  const column = sortColumns[f.sort];
  const direction = f.dir === "asc" ? asc : desc;
  const primary =
    f.sort === "due"
      ? sql`${column} ${sql.raw(f.dir === "asc" ? "asc" : "desc")} nulls last`
      : direction(column);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(tickets)
      .innerJoin(projects, eq(tickets.projectId, projects.id))
      .leftJoin(assignee, eq(tickets.assigneeId, assignee.id))
      .where(where)
      .orderBy(primary, desc(tickets.updatedAt), asc(tickets.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(tickets)
      .innerJoin(projects, eq(tickets.projectId, projects.id))
      .where(where),
  ]);
  return { rows: rows as TicketListRow[], total };
}

/** Small ranked lookup for the command palette. */
export async function searchTickets(q: string, limit = 8) {
  const rows = await db
    .select(listColumns)
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .leftJoin(assignee, eq(tickets.assigneeId, assignee.id))
    .where(q ? textSearch(q) : undefined)
    .orderBy(desc(tickets.updatedAt))
    .limit(limit);
  return rows as TicketListRow[];
}

export async function getTicketByKey(key: string) {
  const parsed = parseTicketKey(key);
  if (!parsed) return null;
  const [row] = await db
    .select({
      ticket: tickets,
      project: { id: projects.id, key: projects.key, name: projects.name, isArchived: projects.isArchived },
      reporter: { id: reporter.id, name: reporter.name },
      assignee: { id: assignee.id, name: assignee.name },
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .innerJoin(reporter, eq(tickets.reporterId, reporter.id))
    .leftJoin(assignee, eq(tickets.assigneeId, assignee.id))
    .where(and(eq(projects.key, parsed.projectKey), eq(tickets.number, parsed.number)));
  if (!row) return null;
  return { ...row, assignee: row.assignee?.id ? row.assignee : null };
}
export type TicketDetail = NonNullable<Awaited<ReturnType<typeof getTicketByKey>>>;

async function assertAssignable(tx: Tx, userId: string) {
  const [user] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, true)));
  if (!user) throw new ActionError("That person can't be assigned tickets.");
}

const isFinished = (status: Status) => FINISHED_STATUSES.includes(status);

/** Creates a ticket with the next number in its project; returns its key. */
export async function createTicket(input: TicketCreateInput, reporterId: string) {
  return db.transaction(async (tx) => {
    // Locking the project row serialises numbering within that project.
    const [project] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .for("update");
    if (!project || project.isArchived) {
      throw new ActionError("That project isn't accepting new tickets.");
    }
    if (input.assigneeId) await assertAssignable(tx, input.assigneeId);

    const [{ max }] = await tx
      .select({ max: sql<number>`coalesce(max(${tickets.number}), 0)`.mapWith(Number) })
      .from(tickets)
      .where(eq(tickets.projectId, project.id));

    const [ticket] = await tx
      .insert(tickets)
      .values({
        ...input,
        projectId: project.id,
        number: max + 1,
        reporterId,
        closedAt: isFinished(input.status) ? new Date() : null,
      })
      .returning({ number: tickets.number });
    return `${project.key}-${ticket.number}`;
  });
}

/** Ticket columns that are user-editable, mapped to their DB column names. */
const TRACKED = {
  title: "title",
  description: "description",
  type: "type",
  priority: "priority",
  status: "status",
  assigneeId: "assignee_id",
  dueDate: "due_date",
} as const satisfies Record<keyof TicketPatch, string>;

const asText = (v: unknown) => (v === null || v === undefined ? null : v instanceof Date ? v.toISOString() : String(v));

/**
 * The single write path for ticket edits: applies the patch and writes one
 * ticket_history row per field that actually changed, in one transaction.
 */
export async function updateTicket(id: string, patch: TicketPatch, userId: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(tickets).where(eq(tickets.id, id)).for("update");
    if (!current) throw new ActionError("That ticket no longer exists.");

    const set: Partial<typeof tickets.$inferInsert> = {};
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    const record = (field: string, oldValue: unknown, newValue: unknown) =>
      changes.push({ field, oldValue: asText(oldValue), newValue: asText(newValue) });

    for (const key of Object.keys(TRACKED) as (keyof TicketPatch)[]) {
      const next = patch[key];
      if (next === undefined) continue;
      const prev = current[key];
      if ((next ?? null) === (prev ?? null)) continue;
      Object.assign(set, { [key]: next });
      record(TRACKED[key], prev, next);
    }
    if (!changes.length) return { changed: false };

    if (set.assigneeId) await assertAssignable(tx, set.assigneeId);

    if (set.status) {
      const closedAt = isFinished(set.status)
        ? isFinished(current.status) ? current.closedAt : new Date()
        : null;
      if (closedAt?.getTime() !== current.closedAt?.getTime()) {
        set.closedAt = closedAt;
        record("closed_at", current.closedAt, closedAt);
      }
    }
    set.updatedAt = new Date();

    await tx.update(tickets).set(set).where(eq(tickets.id, id));
    await tx.insert(ticketHistory).values(changes.map((c) => ({ ...c, ticketId: id, userId })));
    return { changed: true };
  });
}

const ACTIVE: Status[] = ["open", "in_progress", "in_review"];

function ticketRows(where: SQL | undefined, orderBy: SQL[], limit: number) {
  return db
    .select(listColumns)
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .leftJoin(assignee, eq(tickets.assigneeId, assignee.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(limit) as Promise<TicketListRow[]>;
}

export async function getDashboard(userId: string) {
  const [mine, unassigned, recent, counts] = await Promise.all([
    ticketRows(
      and(eq(tickets.assigneeId, userId), inArray(tickets.status, ACTIVE)),
      [desc(tickets.priority), desc(tickets.updatedAt)],
      10,
    ),
    ticketRows(
      and(isNull(tickets.assigneeId), inArray(tickets.status, ACTIVE)),
      [desc(tickets.priority), desc(tickets.createdAt)],
      8,
    ),
    ticketRows(undefined, [desc(tickets.updatedAt)], 8),
    db
      .select({ status: tickets.status, total: count() })
      .from(tickets)
      .groupBy(tickets.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.total])) as Partial<Record<Status, number>>;
  return { mine, unassigned, recent, byStatus };
}
