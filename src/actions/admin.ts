"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-guards";
import { fromZodError, toActionError, type ActionResult } from "@/lib/action-result";
import {
  idSchema,
  passwordResetSchema,
  projectCreateSchema,
  projectUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validation";
import {
  createProject,
  createUser,
  renameProject,
  resetPassword,
  setProjectArchived,
  setUserActive,
  updateUser,
} from "@/server/admin";

const fields = (fd: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, fd.get(n) ?? ""]));

/** Guard → validate → run → revalidate, for every admin form. */
async function adminForm<S extends z.ZodType>(
  schema: S,
  input: unknown,
  run: (data: z.infer<S>, actorId: string) => Promise<void>,
): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await run(parsed.data, admin.id);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createUserAction(_prev: ActionResult, fd: FormData) {
  return adminForm(userCreateSchema, fields(fd, ["name", "email", "role", "password"]), (d) => createUser(d));
}

export async function updateUserAction(_prev: ActionResult, fd: FormData) {
  return adminForm(userUpdateSchema, fields(fd, ["id", "name", "email", "role"]), (d, actor) => updateUser(actor, d));
}

export async function resetPasswordAction(_prev: ActionResult, fd: FormData) {
  return adminForm(passwordResetSchema, fields(fd, ["id", "password"]), (d) => resetPassword(d.id, d.password));
}

export async function setUserActiveAction(id: string, isActive: boolean) {
  return adminForm(
    z.object({ id: idSchema, isActive: z.boolean() }),
    { id, isActive },
    (d, actor) => setUserActive(actor, d.id, d.isActive),
  );
}

export async function createProjectAction(_prev: ActionResult, fd: FormData) {
  return adminForm(projectCreateSchema, fields(fd, ["name", "key"]), (d) => createProject(d));
}

export async function renameProjectAction(_prev: ActionResult, fd: FormData) {
  return adminForm(projectUpdateSchema, fields(fd, ["id", "name"]), (d) => renameProject(d.id, d.name));
}

export async function setProjectArchivedAction(id: string, isArchived: boolean) {
  return adminForm(
    z.object({ id: idSchema, isArchived: z.boolean() }),
    { id, isArchived },
    (d) => setProjectArchived(d.id, d.isArchived),
  );
}
