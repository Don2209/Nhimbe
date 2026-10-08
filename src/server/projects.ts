import "server-only";
import { asc, count, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { projects, tickets } from "@/db/schema";
import { ActionError } from "@/lib/errors";
import { suggestProjectKey } from "@/lib/project-key";
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

/**
 * Creates a project. Without an explicit key, one is derived from the name and
 * made unique (PAY, PAY2, PAY3…), so creating a project never fails on the key.
 */
export async function createProject(input: { name: string; key?: string }) {
  const explicit = input.key || null;
  const base = explicit ?? suggestProjectKey(input.name);
  const taken = new Set(
    (await db.select({ key: projects.key }).from(projects).where(like(projects.key, `${base}%`))).map((p) => p.key),
  );
  if (explicit && taken.has(explicit)) throw new ActionError(`The prefix ${explicit} is already used by another project.`);
  for (let n = 1; n < 100; n++) {
    const key = n === 1 ? base : `${base.slice(0, 8)}${n}`;
    if (taken.has(key)) continue;
    try {
      const [row] = await db.insert(projects).values({ name: input.name, key }).returning();
      return row;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error; // raced with another create: try the next suffix
    }
  }
  throw new ActionError("Couldn't pick a prefix for that name. Try a different name.");
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
