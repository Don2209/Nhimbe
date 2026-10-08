"use server";

import { z } from "zod";
import { assertUser } from "@/lib/auth-guards";
import type { ActionResult } from "@/lib/action-result";
import { commentEditSchema, commentSchema, idSchema } from "@/lib/validation";
import { addComment, deleteComment, updateComment } from "@/server/comments";
import { formFields, runAction } from "./run";

export async function addCommentAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertUser, commentSchema, formFields(fd, ["ticketId", "body"]), (d, actor) =>
    addComment(d.ticketId, actor.id, d.body),
  );
}

export async function updateCommentAction(id: string, body: string) {
  return runAction(assertUser, commentEditSchema, { id, body }, (d, actor) => updateComment(d.id, actor, d.body));
}

export async function deleteCommentAction(id: string) {
  return runAction(assertUser, z.object({ id: idSchema }), { id }, (d, actor) => deleteComment(d.id, actor));
}
