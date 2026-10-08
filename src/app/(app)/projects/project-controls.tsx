"use client";

import { Archive, ArchiveRestore, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProjectAction,
  renameProjectAction,
  setProjectArchivedAction,
} from "@/actions/projects";
import { Field, FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProjectCreateForm } from "@/components/project-create-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AddProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><FolderPlus aria-hidden="true" /> New project</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">New project</DialogTitle>
        </DialogHeader>
        {open && <ProjectCreateForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
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
