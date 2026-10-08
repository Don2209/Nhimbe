"use client";

import { Archive, ArchiveRestore, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  createProjectAction,
  deleteProjectAction,
  renameProjectAction,
  setProjectArchivedAction,
} from "@/actions/projects";
import { Field, FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function AddProjectButton() {
  return (
    <FormDialog
      trigger={<Button><FolderPlus aria-hidden="true" /> New project</Button>}
      title="New project"
      description="The key prefixes every ticket number, like PAY-12. It can't be changed later."
      action={createProjectAction}
      success="Project created"
      submitLabel="Create project"
    >
      {(errors) => (
        <>
          <Field name="name" label="Name" errors={errors} required placeholder="Payments" />
          <Field
            name="key"
            label="Key"
            errors={errors}
            required
            maxLength={10}
            placeholder="PAY"
            className="h-9 font-mono uppercase"
            hint="2–10 letters or digits, starting with a letter."
          />
        </>
      )}
    </FormDialog>
  );
}

export function ProjectRowActions({
  project,
}: {
  project: { id: string; name: string; key: string; isArchived: boolean; ticketCount: number };
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      <FormDialog
        trigger={<Button variant="ghost" size="icon-sm" aria-label={`Rename ${project.name}`} title="Rename"><Pencil aria-hidden="true" /></Button>}
        title="Rename project"
        action={renameProjectAction}
        success="Project renamed"
        submitLabel="Save"
      >
        {(errors) => (
          <>
            <input type="hidden" name="id" value={project.id} />
            <Field name="name" label="Name" defaultValue={project.name} errors={errors} required />
          </>
        )}
      </FormDialog>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={project.isArchived ? `Restore ${project.name}` : `Archive ${project.name}`}
        title={project.isArchived ? "Restore" : "Archive"}
        onClick={() =>
          startTransition(async () => {
            const result = await setProjectArchivedAction(project.id, !project.isArchived);
            if (result.ok) toast.success(project.isArchived ? "Project restored" : "Project archived");
            else toast.error(result.error);
          })
        }
      >
        {project.isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${project.name}`} title="Delete" className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden="true" />
          </Button>
        }
        title={`Delete ${project.name}?`}
        description={
          project.ticketCount > 0
            ? `This permanently deletes the project and its ${project.ticketCount} ${project.ticketCount === 1 ? "ticket" : "tickets"}, with all their comments and history. This can't be undone. To keep the record, archive it instead.`
            : "This permanently deletes the project. This can't be undone."
        }
        confirmText={project.ticketCount > 0 ? project.key : undefined}
        confirmLabel="Delete project"
        success="Project deleted"
        onConfirm={() => deleteProjectAction(project.id)}
      />
    </div>
  );
}
