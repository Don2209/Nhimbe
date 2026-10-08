import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editTicketAction } from "@/actions/tickets";
import { PageHeader } from "@/components/page-header";
import { TicketForm } from "@/components/ticket-form";
import { requireUser } from "@/lib/auth-guards";
import { ticketKey } from "@/lib/tickets";
import { listProjects } from "@/server/projects";
import { getTicketByKey } from "@/server/tickets";
import { listActiveUsers } from "@/server/users";

export async function generateMetadata({ params }: PageProps<"/tickets/[key]/edit">): Promise<Metadata> {
  return { title: `Edit ${decodeURIComponent((await params).key).toUpperCase()}` };
}

export default async function EditTicketPage({ params }: PageProps<"/tickets/[key]/edit">) {
  await requireUser();
  const { key: rawKey } = await params;
  const detail = await getTicketByKey(decodeURIComponent(rawKey));
  if (!detail) notFound();
  const [projects, users] = await Promise.all([listProjects({ includeArchived: true }), listActiveUsers()]);
  const { ticket, project } = detail;
  const key = ticketKey(project.key, ticket.number);

  // Keep a now-inactive assignee selectable so saving doesn't silently unassign.
  const assignable =
    detail.assignee && !users.some((u) => u.id === detail.assignee!.id)
      ? [...users, { id: detail.assignee.id, name: `${detail.assignee.name} (inactive)` }]
      : users;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader title={`Edit ${key}`} description={ticket.title} />
      <TicketForm
        mode="edit"
        action={editTicketAction}
        cancelHref={`/tickets/${key}`}
        projects={projects}
        users={assignable}
        initial={{
          id: ticket.id,
          key,
          projectId: ticket.projectId,
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          status: ticket.status,
          assigneeId: ticket.assigneeId,
          dueDate: ticket.dueDate,
        }}
      />
    </div>
  );
}
