"use server";

import { z } from "zod";
import { assertUser } from "@/lib/auth-guards";
import type { ActionResult } from "@/lib/action-result";
import { idSchema, projectCreateSchema, projectUpdateSchema } from "@/lib/validation";
import { createProject, deleteProject, renameProject, setProjectArchived } from "@/server/projects";
import { formFields, runAction } from "./run";

// Any signed-in team member can manage projects.

export async function createProjectAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertUser, projectCreateSchema, formFields(fd, ["name", "key"]), (d) => createProject(d));
}

export async function renameProjectAction(_prev: ActionResult, fd: FormData) {
  return runAction(assertUser, projectUpdateSchema, formFields(fd, ["id", "name"]), (d) => renameProject(d.id, d.name));
}

export async function setProjectArchivedAction(id: string, isArchived: boolean) {
  return runAction(
    assertUser,
    z.object({ id: idSchema, isArchived: z.boolean() }),
    { id, isArchived },
    (d) => setProjectArchived(d.id, d.isArchived),
  );
}

export async function deleteProjectAction(id: string) {
  return runAction(assertUser, z.object({ id: idSchema }), { id }, async (d) => {
    await deleteProject(d.id);
  });
}
