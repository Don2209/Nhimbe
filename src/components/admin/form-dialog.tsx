"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";

type Errors = Record<string, string[] | undefined> | undefined;

export function Field({
  name,
  label,
  errors,
  hint,
  ...props
}: React.ComponentProps<"input"> & { name: string; label: string; errors: Errors; hint?: string }) {
  const error = errors?.[name]?.[0];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Input
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `f-${name}-error` : hint ? `f-${name}-hint` : undefined}
        className="h-9"
        {...props}
      />
      {error ? (
        <p id={`f-${name}-error`} className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p id={`f-${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function DialogForm({
  action,
  onDone,
  success,
  submitLabel,
  children,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  onDone: () => void;
  success: string;
  submitLabel: string;
  children: (errors: Errors) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(async (prev: ActionResult, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.ok) {
      toast.success(success);
      onDone();
    }
    return result;
  }, { ok: true });
  const errors = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4">
      {children(errors)}
      {!state.ok && !state.fieldErrors && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A dialog wrapping a server-action form; closes and toasts on success. */
export function FormDialog({
  trigger,
  title,
  description,
  ...form
}: {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  success: string;
  submitLabel: string;
  children: (errors: Errors) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* Remount per opening so stale errors don't linger. */}
        {open && <DialogForm {...form} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
