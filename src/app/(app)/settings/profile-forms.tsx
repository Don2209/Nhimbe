"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/actions/profile";
import { Field } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

function useToastAction(
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>,
  success: string,
  onSuccess?: () => void,
) {
  return useActionState(async (prev: ActionResult, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.ok) {
      toast.success(success);
      onSuccess?.();
    }
    return result;
  }, { ok: true });
}

function FormError({ state }: { state: ActionResult }) {
  if (state.ok || state.fieldErrors) return null;
  return <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>;
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useToastAction(updateProfileAction, "Profile saved");
  const errors = state.ok ? undefined : state.fieldErrors;
  return (
    <form action={action} className="space-y-4">
      <Field name="name" label="Name" defaultValue={name} errors={errors} required autoComplete="name" />
      <Field name="email" label="Email" type="email" defaultValue={email} errors={errors} required autoComplete="email" hint="You sign in with this address." />
      <FormError state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useToastAction(changePasswordAction, "Password changed", () => formRef.current?.reset());
  const errors = state.ok ? undefined : state.fieldErrors;
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <Field name="currentPassword" label="Current password" type="password" errors={errors} required autoComplete="current-password" />
      <Field name="newPassword" label="New password" type="password" errors={errors} required minLength={10} autoComplete="new-password" hint="At least 10 characters." />
      <Field name="confirmPassword" label="Confirm new password" type="password" errors={errors} required autoComplete="new-password" />
      <FormError state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Change password
        </Button>
      </div>
    </form>
  );
}
