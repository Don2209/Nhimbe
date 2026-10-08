import { z } from "zod";
import { UnauthorizedError } from "@/lib/auth-guards";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function fromZodError(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Check the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/** User-facing errors thrown from services. */
export class ActionError extends Error {}

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof UnauthorizedError) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  if (error instanceof ActionError) return { ok: false, error: error.message };
  console.error(error);
  return { ok: false, error: "Something went wrong. Please try again." };
}
