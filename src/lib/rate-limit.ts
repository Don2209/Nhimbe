import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;

/**
 * Tight per account+IP bucket, a looser per-IP bucket against credential
 * spraying, and a per-account cap that holds even if the client IP is spoofed.
 */
export function loginKeys(email: string, ip: string) {
  return [
    { key: `acct-ip:${email}|${ip}`, limit: 5 },
    { key: `ip:${ip}`, limit: 30 },
    { key: `acct:${email}`, limit: 20 },
  ];
}

export async function isRateLimited(keys: { key: string; limit: number }[]) {
  for (const { key, limit } of keys) {
    const [row] = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.key, key));
    if (!row) continue;
    const windowOpen =
      row.windowStart.getTime() > Date.now() - WINDOW_MINUTES * 60_000;
    if (windowOpen && row.count >= limit) return true;
  }
  return false;
}

export async function recordFailure(keys: { key: string }[]) {
  for (const { key } of keys) {
    // Reset the counter when the previous window has expired.
    await db
      .insert(loginAttempts)
      .values({ key, count: 1 })
      .onConflictDoUpdate({
        target: loginAttempts.key,
        set: {
          count: sql`case when ${loginAttempts.windowStart} < now() - make_interval(mins => ${WINDOW_MINUTES}) then 1 else ${loginAttempts.count} + 1 end`,
          windowStart: sql`case when ${loginAttempts.windowStart} < now() - make_interval(mins => ${WINDOW_MINUTES}) then now() else ${loginAttempts.windowStart} end`,
        },
      });
  }
}

export async function clearFailures(keys: string[]) {
  await db.delete(loginAttempts).where(inArray(loginAttempts.key, keys));
}
