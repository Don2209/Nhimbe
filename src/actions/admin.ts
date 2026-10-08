"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth-guards";
import type { ActionResult } from "@/lib/action-result";
import {
  idSchema,
  passwordResetSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validation";
import {
  createUser,
  deleteUser,
  resetPassword,
  setUserActive,
  updateUser,
} from "@/server/admin";
import { formFields, runAction } from "./run";

export async function createUserAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertAdmin, userCreateSchema, formFields(fd, ["name", "email", "role", "password"]), (d) => createUser(d));
}

export async function updateUserAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertAdmin, userUpdateSchema, formFields(fd, ["id", "name", "email", "role"]), (d, actor) => updateUser(actor.id, d));
}

export async function resetPasswordAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertAdmin, passwordResetSchema, formFields(fd, ["id", "password"]), (d) => resetPassword(d.id, d.password));
}

export async function setUserActiveAction(id: string, isActive: boolean) {
  return runAction(
    assertAdmin,
    z.object({ id: idSchema, isActive: z.boolean() }),
    { id, isActive },
    (d, actor) => setUserActive(actor.id, d.id, d.isActive),
  );
}

export async function deleteUserAction(id: string) {
  return runAction(assertAdmin, z.object({ id: idSchema }), { id }, (d, actor) => deleteUser(actor.id, d.id));
}
