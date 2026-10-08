"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { useTicketPatch } from "@/components/ticket/use-ticket-patch";

export function InlineTitle({ ticketId, title: initial }: { ticketId: string; title: string }) {
  const { values, save } = useTicketPatch(ticketId, { title: initial });
  const [editing, setEditing] = useState(false);

  function commit(value: string) {
    setEditing(false);
    const next = value.trim();
    if (next && next !== values.title) save({ title: next });
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        aria-label="Ticket title"
        defaultValue={values.title}
        maxLength={200}
        rows={1}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        className="field-sizing-content w-full resize-none rounded-md bg-card px-1 -mx-1 font-heading text-2xl font-semibold tracking-tight outline-none ring-2 ring-ring sm:text-display"
      />
    );
  }

  return (
    <h1 className="group text-2xl font-semibold tracking-tight sm:text-display">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="-mx-1 rounded-md px-1 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${values.title}. Edit title`}
      >
        {values.title}
        <Pencil className="ml-2 inline size-4 align-middle text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </button>
    </h1>
  );
}
