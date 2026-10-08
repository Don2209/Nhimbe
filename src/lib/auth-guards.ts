import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { UnauthorizedError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "developer" | "admin";
};

/**
 * Resolves the signed-in user from the session cookie, re-checking the DB so
 * deactivation and role changes apply on the very next request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}

export { UnauthorizedError };

/** For server actions: throws instead of redirecting. */
export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("Not signed in");
  return user;
}

export async function assertAdmin() {
  const user = await assertUser();
  if (user.role !== "admin") throw new UnauthorizedError("Admins only");
  return user;
}
