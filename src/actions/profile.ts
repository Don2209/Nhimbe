"use server";

import { assertUser } from "@/lib/auth-guards";
import type { ActionResult } from "@/lib/action-result";
import { passwordChangeSchema, profileSchema } from "@/lib/validation";
import { changePassword, updateProfile } from "@/server/profile";
import { formFields, runAction } from "./run";

export async function updateProfileAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertUser, profileSchema, formFields(fd, ["name", "email"]), (d, actor) => updateProfile(actor.id, d));
}

export async function changePasswordAction(_prev: ActionResult, fd: FormData) {
  return runAction(
    assertUser,
    passwordChangeSchema,
    formFields(fd, ["currentPassword", "newPassword", "confirmPassword"]),
    (d, actor) => changePassword(actor.id, d.currentPassword, d.newPassword),
  );
}
