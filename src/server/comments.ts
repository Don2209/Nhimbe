import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, ticketHistory, tickets, users } from "@/db/schema";
import { ActionError } from "@/lib/action-result";

export async function addComment(ticketId: string, userId: string, body: string) {
  await db.transaction(async (tx) => {
    const [ticket] = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, ticketId));
    if (!ticket) throw new ActionError("That ticket no longer exists.");
    await tx.insert(comments).values({ ticketId, userId, body });
    await tx.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId));
  });
}

export type ActivityItem =
  | {
      kind: "comment";
      id: string;
      createdAt: Date;
      user: { id: string; name: string };
      body: string;
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
