import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import { createTicketAction } from "@/actions/tickets";
import { EmptyState } from "@/components/empty-state";
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
        <EmptyState icon={FolderPlus} title="No active projects">
          Tickets live in projects. Ask an admin to create one first.
        </EmptyState>
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
