"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth-guards";
import { fromZodError, toActionError, type ActionResult } from "@/lib/action-result";
import { ticketKey } from "@/lib/tickets";
import {
  idSchema,
  ticketCreateSchema,
  ticketPatchSchema,
  type TicketPatch,
} from "@/lib/validation";
import { createTicket, deleteTicket, searchTickets, updateTicket, type TicketListRow } from "@/server/tickets";

function ticketFields(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    type: formData.get("type"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
  };
}

export async function createTicketAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let key: string;
  try {
    const user = await assertUser();
    const parsed = ticketCreateSchema.safeParse({
      ...ticketFields(formData),
      projectId: formData.get("projectId"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    key = await createTicket(parsed.data, user.id);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/tickets/${key}`);
}

export async function editTicketAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let key: string;
  try {
    const user = await assertUser();
    const id = idSchema.parse(formData.get("id"));
    const parsed = ticketPatchSchema.required().safeParse(ticketFields(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    await updateTicket(id, parsed.data, user.id);
    key = String(formData.get("key"));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/tickets/${encodeURIComponent(key)}`);
}

/** Inline edits from the ticket page: one or more fields at a time. */
export async function patchTicketAction(
  ticketId: string,
  patch: TicketPatch,
): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const id = idSchema.parse(ticketId);
    const parsed = ticketPatchSchema.safeParse(patch);
    if (!parsed.success) return fromZodError(parsed.error);
    await updateTicket(id, parsed.data, user.id);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export type PaletteTicket = Pick<TicketListRow, "id" | "title" | "status" | "priority"> & {
  key: string;
};

export async function searchTicketsAction(query: string): Promise<PaletteTicket[]> {
  await assertUser();
  const q = typeof query === "string" ? query.trim().slice(0, 200) : "";
  const rows = await searchTickets(q);
  return rows.map((r) => ({
    id: r.id,
    key: ticketKey(r.projectKey, r.number),
    title: r.title,
    status: r.status,
    priority: r.priority,
  }));
}

export async function deleteTicketAction(ticketId: string): Promise<ActionResult> {
  try {
    await assertUser();
    await deleteTicket(idSchema.parse(ticketId));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/", "layout");
  redirect("/tickets");
}
