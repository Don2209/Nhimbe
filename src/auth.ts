import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { clearFailures, isRateLimited, loginKeys, recordFailure } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

// Compared against when the email is unknown, so response time doesn't reveal
// which accounts exist.
const DUMMY_HASH = "$2b$12$GEM0KS9XzocPi2NT8bhJtO4xbHatnrq25kYjKf63xo53LXbNplB66";

// On Vercel these headers are set by the platform edge, not the client.
function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const keys = loginKeys(email, clientIp(request));
        if (await isRateLimited(keys)) throw new RateLimited();

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );
        if (!user || !valid || !user.isActive) {
          await recordFailure(keys);
          return null;
        }

        await clearFailures([keys[0].key, keys[2].key]);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
