"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { addCommentAction } from "@/actions/comments";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function CommentForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addCommentAction, { ok: true });
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Clear the editor after a successful post.
  useEffect(() => {
    if (submitted.current && !pending && state.ok) {
      submitted.current = false;
      setResetKey((k) => k + 1);
    }
  }, [pending, state]);

  const error = state.ok ? null : (state.fieldErrors?.body?.[0] ?? state.error);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        submitted.current = true;
        action(fd);
      }}
      className="space-y-2"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <MarkdownEditor
        key={resetKey}
        name="body"
        aria-label="Add a comment"
        placeholder="Add a comment…"
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "comment-error" : undefined}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <p id="comment-error" role="alert" className="text-xs text-destructive">{error}</p>
        ) : (
          <span className="text-2xs text-muted-foreground">Ctrl/⌘ + Enter to post</span>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          Comment
        </Button>
      </div>
    </form>
  );
}
