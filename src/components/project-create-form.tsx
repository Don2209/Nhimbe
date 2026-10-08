"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { createProjectAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { suggestProjectKey } from "@/lib/project-key";

/** Create a project from just a name; the ticket prefix is suggested for you. */
export function ProjectCreateForm({ onDone, autoFocus = true }: { onDone?: () => void; autoFocus?: boolean }) {
  const [name, setName] = useState("");
  const [customKey, setCustomKey] = useState<string | null>(null);
  const [state, action, pending] = useActionState(async (prev: ActionResult, fd: FormData) => {
    const result = await createProjectAction(prev, fd);
    if (result.ok) {
      toast.success("Project created");
      setName("");
      setCustomKey(null);
      onDone?.();
    }
    return result;
  }, { ok: true });

  const errors = state.ok ? undefined : state.fieldErrors;
  const error = state.ok ? null : (errors?.name?.[0] ?? errors?.key?.[0] ?? state.error);
  const preview = (customKey ?? (name.trim() ? suggestProjectKey(name) : "")).replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Payments, Website, Mobile app"
          required
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={120}
          className="h-10 bg-card"
          aria-invalid={error ? true : undefined}
          aria-describedby="project-key-preview"
        />
      </div>

      {customKey === null ? (
        <p id="project-key-preview" className="text-xs text-muted-foreground">
          {preview ? (
            <>
              Tickets will be numbered{" "}
              <span className="font-mono font-semibold text-terracotta">{preview}-1</span>,{" "}
              <span className="font-mono font-semibold text-terracotta">{preview}-2</span>…{" "}
              <button
                type="button"
                className="rounded font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setCustomKey(preview)}
              >
                change
              </button>
            </>
          ) : (
            "Just a name is enough. We'll pick a short prefix for ticket numbers."
          )}
        </p>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="project-key">Ticket prefix</Label>
          <div className="flex items-center gap-2">
            <Input
              id="project-key"
              name="key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
              maxLength={10}
              autoComplete="off"
              className="h-9 w-32 bg-card font-mono uppercase"
            />
            <span className="font-mono text-xs text-muted-foreground">→ {preview || "…"}-1</span>
            <button
              type="button"
              className="ml-auto rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => setCustomKey(null)}
            >
              use automatic
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending || !name.trim()} className="w-full sm:w-auto">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Create project
      </Button>
    </form>
  );
}
