import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, ticketHistory, tickets, users } from "@/db/schema";
import { ActionError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-guards";

export async function addComment(ticketId: string, userId: string, body: string) {
  await db.transaction(async (tx) => {
    const [ticket] = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, ticketId));
    if (!ticket) throw new ActionError("That ticket no longer exists.");
    await tx.insert(comments).values({ ticketId, userId, body });
    await tx.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId));
  });
}

/** Authors can change their own comments; admins can change anyone's. */
async function editableComment(id: string, actor: SessionUser) {
  const [comment] = await db.select().from(comments).where(eq(comments.id, id));
  if (!comment) throw new ActionError("That comment no longer exists.");
  if (comment.userId !== actor.id && actor.role !== "admin") {
    throw new ActionError("You can only change your own comments.");
  }
  return comment;
}

export async function updateComment(id: string, actor: SessionUser, body: string) {
  const comment = await editableComment(id, actor);
  if (comment.body === body) return;
  await db
    .update(comments)
    .set({ body, updatedAt: new Date() })
    .where(and(eq(comments.id, id), eq(comments.ticketId, comment.ticketId)));
}

export async function deleteComment(id: string, actor: SessionUser) {
  await editableComment(id, actor);
  await db.delete(comments).where(eq(comments.id, id));
}

export type ActivityItem =
  | {
      kind: "comment";
      id: string;
      createdAt: Date;
      user: { id: string; name: string };
      body: string;
      editedAt: Date | null;
    }
  | {
      kind: "change";
      id: string;
      createdAt: Date;
      user: { id: string; name: string };
      field: string;
      oldValue: string | null;
      newValue: string | null;
    };

/** Comments and field changes for a ticket, oldest first. */
export async function getActivity(ticketId: string): Promise<ActivityItem[]> {
  const [commentRows, historyRows] = await Promise.all([
    db
      .select({
        id: comments.id,
        createdAt: comments.createdAt,
        body: comments.body,
        editedAt: comments.updatedAt,
        user: { id: users.id, name: users.name },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.ticketId, ticketId))
      .orderBy(asc(comments.createdAt)),
    db
      .select({
        id: ticketHistory.id,
        createdAt: ticketHistory.createdAt,
        field: ticketHistory.field,
        oldValue: ticketHistory.oldValue,
        newValue: ticketHistory.newValue,
        user: { id: users.id, name: users.name },
      })
      .from(ticketHistory)
      .innerJoin(users, eq(ticketHistory.userId, users.id))
      .where(eq(ticketHistory.ticketId, ticketId))
      .orderBy(asc(ticketHistory.createdAt)),
  ]);

  return [
    ...commentRows.map((c) => ({ kind: "comment" as const, ...c })),
    ...historyRows.map((h) => ({ kind: "change" as const, ...h })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
