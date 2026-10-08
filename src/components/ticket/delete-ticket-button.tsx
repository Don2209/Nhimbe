"use client";

import { Trash2 } from "lucide-react";
import { deleteTicketAction } from "@/actions/tickets";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteTicketButton({ ticketId, ticketKey }: { ticketId: string; ticketKey: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 aria-hidden="true" /> Delete
        </Button>
      }
      title={`Delete ${ticketKey}?`}
      description="This permanently deletes the ticket with all its comments and history. This can't be undone."
      confirmLabel="Delete ticket"
      onConfirm={() => deleteTicketAction(ticketId)}
    />
  );
}
