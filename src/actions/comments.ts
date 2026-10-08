"use server";

import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/auth-guards";
import { fromZodError, toActionError, type ActionResult } from "@/lib/action-result";
import { commentSchema } from "@/lib/validation";
import { addComment } from "@/server/comments";

export async function addCommentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = commentSchema.safeParse({
      ticketId: formData.get("ticketId"),
      body: formData.get("body") ?? "",
    });
    if (!parsed.success) return fromZodError(parsed.error);
    await addComment(parsed.data.ticketId, user.id, parsed.data.body);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
