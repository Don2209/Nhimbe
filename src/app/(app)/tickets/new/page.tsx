import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import { createTicketAction } from "@/actions/tickets";
import { ProjectCreateForm } from "@/components/project-create-form";
import { PageHeader } from "@/components/page-header";
import { TicketForm } from "@/components/ticket-form";
import { requireUser } from "@/lib/auth-guards";
import { listProjects } from "@/server/projects";
import { listActiveUsers } from "@/server/users";

export const metadata: Metadata = { title: "New ticket" };

export default async function NewTicketPage({ searchParams }: PageProps<"/tickets/new">) {
  await requireUser();
  const [projects, users, { project }] = await Promise.all([
    listProjects(),
    listActiveUsers(),
    searchParams,
  ]);
  const preferred = projects.find((p) => p.key === String(project ?? "").toUpperCase());

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader title="New ticket" description="Write it down so the team can pick it up." />
      {projects.length === 0 ? (
        <section className="max-w-md rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <FolderPlus className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">First, name a project</h2>
              <p className="text-sm text-muted-foreground">Tickets live in projects. Once it&rsquo;s created, the ticket form appears right here.</p>
            </div>
          </div>
          <ProjectCreateForm />
        </section>
      ) : (
        <TicketForm
          mode="create"
          action={createTicketAction}
          cancelHref="/tickets"
          projects={projects}
          users={users}
          initial={{
            projectId: (preferred ?? projects[0]).id,
            title: "",
            description: "",
            type: "task",
            priority: "medium",
            status: "open",
            assigneeId: null,
            dueDate: null,
          }}
        />
      )}
    </div>
  );
}
