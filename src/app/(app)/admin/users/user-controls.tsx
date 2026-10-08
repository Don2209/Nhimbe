"use client";

import { KeyRound, Pencil, Power, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  setUserActiveAction,
  updateUserAction,
} from "@/actions/admin";
import { Field, FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/constants";

function RoleSelect({ defaultValue, disabled }: { defaultValue: Role; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="f-role">Role</Label>
      <NativeSelect id="f-role" name="role" defaultValue={defaultValue} disabled={disabled}>
        <option value="developer">Developer: tickets and comments</option>
        <option value="admin">Admin: also manages users and projects</option>
      </NativeSelect>
      {disabled && (
        <>
          <input type="hidden" name="role" value={defaultValue} />
          <p className="text-xs text-muted-foreground">You can&rsquo;t change your own role.</p>
        </>
      )}
    </div>
  );
}

export function AddUserButton() {
  return (
    <FormDialog
      trigger={<Button><UserPlus aria-hidden="true" /> Add person</Button>}
      title="Add a person"
      description="They can sign in straight away with this email and password."
      action={createUserAction}
      success="Person added"
      submitLabel="Add person"
    >
      {(errors) => (
        <>
          <Field name="name" label="Name" errors={errors} required autoComplete="off" />
          <Field name="email" label="Email" type="email" errors={errors} required autoComplete="off" />
          <RoleSelect defaultValue="developer" />
          <Field
            name="password"
            label="Temporary password"
            type="password"
            errors={errors}
            required
            minLength={10}
            autoComplete="new-password"
            hint="At least 10 characters. Share it with them privately."
          />
        </>
      )}
    </FormDialog>
  );
}

export function UserRowActions({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; role: Role; isActive: boolean };
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, !user.isActive);
      setConfirming(false);
      if (result.ok) toast.success(user.isActive ? `${user.name} deactivated` : `${user.name} reactivated`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <FormDialog
        trigger={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${user.name}`} title="Edit"><Pencil aria-hidden="true" /></Button>}
        title={`Edit ${user.name}`}
        action={updateUserAction}
        success="Changes saved"
        submitLabel="Save"
      >
        {(errors) => (
          <>
            <input type="hidden" name="id" value={user.id} />
            <Field name="name" label="Name" defaultValue={user.name} errors={errors} required />
            <Field name="email" label="Email" type="email" defaultValue={user.email} errors={errors} required />
            <RoleSelect defaultValue={user.role} disabled={isSelf} />
          </>
        )}
      </FormDialog>
      <FormDialog
        trigger={<Button variant="ghost" size="icon-sm" aria-label={`Reset password for ${user.name}`} title="Reset password"><KeyRound aria-hidden="true" /></Button>}
        title="Reset password"
        description={`Set a new password for ${user.name}. Their current sessions stay signed in.`}
        action={resetPasswordAction}
        success="Password updated"
        submitLabel="Set password"
      >
        {(errors) => (
          <>
            <input type="hidden" name="id" value={user.id} />
            <Field name="password" label="New password" type="password" errors={errors} required minLength={10} autoComplete="new-password" hint="At least 10 characters." />
          </>
        )}
      </FormDialog>
      {!isSelf &&
        (confirming ? (
          <span className="flex items-center gap-1">
            <Button size="sm" variant={user.isActive ? "destructive" : "default"} disabled={pending} onClick={toggleActive}>
              {user.isActive ? "Deactivate" : "Reactivate"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={user.isActive ? `Deactivate ${user.name}` : `Reactivate ${user.name}`}
            title={user.isActive ? "Deactivate" : "Reactivate"}
            onClick={() => setConfirming(true)}
          >
            <Power aria-hidden="true" />
          </Button>
        ))}
      {!isSelf && (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${user.name}`} title="Delete" className="text-destructive hover:text-destructive">
              <Trash2 aria-hidden="true" />
            </Button>
          }
          title={`Delete ${user.name}?`}
          description="This removes the account permanently. It only works for people with no tickets, comments or edits; anyone with history can be deactivated instead. Tickets assigned to them become unassigned."
          confirmLabel="Delete account"
          success={`${user.name} deleted`}
          onConfirm={() => deleteUserAction(user.id)}
        />
      )}
    </div>
  );
}
