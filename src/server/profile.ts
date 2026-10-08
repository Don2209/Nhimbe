import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ActionError } from "@/lib/errors";
import { isUniqueViolation } from "@/server/db-errors";

export async function updateProfile(userId: string, input: { name: string; email: string }) {
  try {
    await db.update(users).set(input).where(eq(users.id, userId));
  } catch (error) {
    if (isUniqueViolation(error)) throw new ActionError("Someone already uses that email address.");
    throw error;
  }
}

export async function changePassword(userId: string, current: string, next: string) {
  const [user] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user || !(await bcrypt.compare(current, user.hash))) {
    throw new ActionError("Your current password isn't right.");
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(users.id, userId));
}
