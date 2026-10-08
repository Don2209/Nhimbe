"use client";

import { FileText, Pencil } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useTicketPatch } from "@/components/ticket/use-ticket-patch";
import { Button } from "@/components/ui/button";

export function InlineDescription({ ticketId, description: initial }: { ticketId: string; description: string }) {
  const { values, save, pending } = useTicketPatch(ticketId, { description: initial });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);

  if (editing) {
    return (
      <div
        className="space-y-2"
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save({ description: draft });
            setEditing(false);
          }
        }}
      >
        <MarkdownEditor
          aria-label="Description"
          autoFocus
          defaultValue={values.description}
          onValueChange={setDraft}
          rows={10}
        />
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-2xs text-muted-foreground">Ctrl/⌘ + Enter to save · Esc to cancel</span>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              save({ description: draft });
              setEditing(false);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Description" className="group relative">
      {values.description.trim() ? (
        <Markdown>{values.description}</Markdown>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" aria-hidden="true" /> No description yet. Add context so others can help.
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 sm:absolute sm:-top-1 sm:right-0 sm:mt-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        onClick={() => {
          setDraft(values.description);
          setEditing(true);
        }}
      >
        <Pencil aria-hidden="true" /> Edit description
      </Button>
    </section>
  );
}
