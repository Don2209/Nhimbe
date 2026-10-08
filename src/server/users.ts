import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type UserOption = { id: string; name: string };

/** People who can be assigned tickets. */
export async function listActiveUsers(): Promise<UserOption[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name));
}

/** Everyone, including deactivated people, for resolving names in history. */
export async function listAllUserNames(): Promise<UserOption[]> {
  return db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name));
}
