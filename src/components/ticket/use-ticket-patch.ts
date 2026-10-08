"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { patchTicketAction } from "@/actions/tickets";
import type { TicketPatch } from "@/lib/validation";

/** Optimistically applies a field edit and persists it via the server action. */
export function useTicketPatch<T extends TicketPatch>(ticketId: string, values: T) {
  const [optimistic, setOptimistic] = useOptimistic(values, (state, patch: Partial<T>) => ({
    ...state,
    ...patch,
  }));
  const [pending, startTransition] = useTransition();

  function save(patch: Partial<T>, message?: string) {
    startTransition(async () => {
      setOptimistic(patch);
      const result = await patchTicketAction(ticketId, patch);
      if (!result.ok) {
        const detail = result.fieldErrors && Object.values(result.fieldErrors).flat()[0];
        toast.error(detail ?? result.error);
      } else if (message) {
        toast.success(message);
      }
    });
  }

  return { values: optimistic, save, pending };
}
