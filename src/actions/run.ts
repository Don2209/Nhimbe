import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type SessionUser } from "@/lib/auth-guards";
import { fromZodError, toActionError, type ActionResult } from "@/lib/action-result";

/** Guard → validate → run → revalidate. Shared by every form-style action. */
export async function runAction<S extends z.ZodType>(
  guard: () => Promise<SessionUser>,
  schema: S,
  input: unknown,
  run: (data: z.infer<S>, actor: SessionUser) => Promise<void>,
): Promise<ActionResult> {
  try {
    const actor = await guard();
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await run(parsed.data, actor);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export const formFields = (fd: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, fd.get(n) ?? ""]));
