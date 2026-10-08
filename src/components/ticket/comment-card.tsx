"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCommentAction, updateCommentAction } from "@/actions/comments";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";

/** Comment body with edit/delete controls for its author (and admins). */
export function CommentCard({
  id,
  author,
  body,
  header,
  canEdit,
}: {
  id: string;
  author: string;
  body: string;
  header: React.ReactNode;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateCommentAction(id, draft);
      if (result.ok) setEditing(false);
      else toast.error(result.fieldErrors?.body?.[0] ?? result.error);
    });
  }

  return (
    <article className="group min-w-0 flex-1 rounded-xl border bg-card shadow-xs">
      <header className="flex items-center gap-2 border-b px-3 py-2 text-sm">
        {header}
        {canEdit && !editing && (
          <span className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit comment by ${author}`}
              title="Edit"
              onClick={() => {
                setDraft(body);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-xs" aria-label={`Delete comment by ${author}`} title="Delete" className="text-destructive hover:text-destructive">
                  <Trash2 aria-hidden="true" />
                </Button>
              }
              title="Delete this comment?"
              description="It will be removed from the ticket for everyone. This can't be undone."
              confirmLabel="Delete comment"
              success="Comment deleted"
              onConfirm={() => deleteCommentAction(id)}
            />
          </span>
        )}
      </header>
      <div className="px-3 py-2.5">
        {editing ? (
          <div
            className="space-y-2"
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}
          >
            <MarkdownEditor aria-label="Edit comment" autoFocus defaultValue={body} onValueChange={setDraft} rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" disabled={pending} onClick={save}>Save</Button>
            </div>
          </div>
        ) : (
          <Markdown>{body}</Markdown>
        )}
      </div>
    </article>
  );
}
