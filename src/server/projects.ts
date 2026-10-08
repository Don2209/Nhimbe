import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export async function listProjects({ includeArchived = false } = {}) {
  return db
    .select()
    .from(projects)
    .where(includeArchived ? undefined : eq(projects.isArchived, false))
    .orderBy(asc(projects.name));
}
