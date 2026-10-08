import "server-only";
import bcrypt from "bcryptjs";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, ticketHistory, tickets, users } from "@/db/schema";
import { ActionError } from "@/lib/errors";
import type { Role } from "@/lib/constants";
import { isUniqueViolation } from "@/server/db-errors";

export async function listUsersForAdmin() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      openTickets: sql<number>`(select count(*) from ${tickets} where ${tickets.assigneeId} = ${users.id} and ${tickets.status} in ('open','in_progress','in_review'))`.mapWith(Number),
    })
    .from(users)
    .orderBy(desc(users.isActive), asc(users.name));
}
export type AdminUserRow = Awaited<ReturnType<typeof listUsersForAdmin>>[number];

export async function createUser(input: { name: string; email: string; role: Role; password: string }) {
  try {
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 12),
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ActionError("Someone already uses that email address.");
    throw error;
  }
}

export async function updateUser(
  actorId: string,
  input: { id: string; name: string; email: string; role: Role },
) {
  if (input.id === actorId && input.role !== "admin") {
    throw new ActionError("You can't remove your own admin role.");
  }
  try {
    const updated = await db
      .update(users)
      .set({ name: input.name, email: input.email, role: input.role })
      .where(eq(users.id, input.id))
      .returning({ id: users.id });
    if (!updated.length) throw new ActionError("That user no longer exists.");
  } catch (error) {
    if (isUniqueViolation(error)) throw new ActionError("Someone already uses that email address.");
    throw error;
  }
}

export async function setUserActive(actorId: string, id: string, isActive: boolean) {
  if (id === actorId && !isActive) throw new ActionError("You can't deactivate your own account.");
  await db.update(users).set({ isActive }).where(eq(users.id, id));
}

export async function resetPassword(id: string, password: string) {
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 12) })
    .where(eq(users.id, id));
}

/**
 * Deletes an account that has no recorded activity. People who reported
 * tickets, commented or changed fields are part of the record, so they can
 * only be deactivated. Tickets assigned to the deleted user become unassigned.
 */
export async function deleteUser(actorId: string, id: string) {
  if (id === actorId) throw new ActionError("You can't delete your own account.");
  await db.transaction(async (tx) => {
    const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, id)).for("update");
    if (!user) throw new ActionError("That user no longer exists.");
    const [activity] = await tx
      .select({
        reported: sql<number>`(select count(*) from ${tickets} where ${tickets.reporterId} = ${id})`.mapWith(Number),
        commented: sql<number>`(select count(*) from ${comments} where ${comments.userId} = ${id})`.mapWith(Number),
        changed: sql<number>`(select count(*) from ${ticketHistory} where ${ticketHistory.userId} = ${id})`.mapWith(Number),
      })
      .from(users)
      .where(eq(users.id, id));
    if (activity.reported + activity.commented + activity.changed > 0) {
      throw new ActionError(
        `${user.name} has reported tickets, commented or edited tickets, so deleting them would break that history. Deactivate the account instead.`,
      );
    }
    await tx.delete(users).where(eq(users.id, id));
  });
}
