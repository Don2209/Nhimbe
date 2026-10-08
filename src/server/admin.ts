import "server-only";
import bcrypt from "bcryptjs";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, tickets, users } from "@/db/schema";
import { ActionError } from "@/lib/action-result";
import type { Role } from "@/lib/constants";

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

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

export async function listProjectsForAdmin() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      isArchived: projects.isArchived,
      ticketCount: count(tickets.id),
    })
    .from(projects)
    .leftJoin(tickets, eq(tickets.projectId, projects.id))
    .groupBy(projects.id)
    .orderBy(asc(projects.isArchived), asc(projects.name));
}
export type AdminProjectRow = Awaited<ReturnType<typeof listProjectsForAdmin>>[number];

export async function createProject(input: { name: string; key: string }) {
  try {
    await db.insert(projects).values(input);
  } catch (error) {
    if (isUniqueViolation(error)) throw new ActionError(`The key ${input.key} is already taken.`);
    throw error;
  }
}

export async function renameProject(id: string, name: string) {
  await db.update(projects).set({ name }).where(eq(projects.id, id));
}

export async function setProjectArchived(id: string, isArchived: boolean) {
  await db.update(projects).set({ isArchived }).where(eq(projects.id, id));
}
