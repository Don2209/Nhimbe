import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, tickets } from "@/db/schema";
import { ActionError } from "@/lib/errors";
import { isUniqueViolation } from "@/server/db-errors";

export async function listProjects({ includeArchived = false } = {}) {
  return db
    .select()
    .from(projects)
    .where(includeArchived ? undefined : eq(projects.isArchived, false))
    .orderBy(asc(projects.name));
}

export async function listProjectsWithCounts() {
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
export type ProjectRow = Awaited<ReturnType<typeof listProjectsWithCounts>>[number];

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

/** Deletes a project and all of its tickets (their comments and history cascade). */
export async function deleteProject(id: string) {
  return db.transaction(async (tx) => {
    const [project] = await tx.select().from(projects).where(eq(projects.id, id)).for("update");
    if (!project) throw new ActionError("That project no longer exists.");
    const removed = await tx.delete(tickets).where(eq(tickets.projectId, id)).returning({ id: tickets.id });
    await tx.delete(projects).where(eq(projects.id, id));
    return { key: project.key, tickets: removed.length };
  });
}
