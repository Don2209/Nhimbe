import { ChevronRight, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActivityTimeline } from "@/components/ticket/activity-timeline";
import { CommentForm } from "@/components/ticket/comment-form";
import { InlineDescription } from "@/components/ticket/inline-description";
import { InlineTitle } from "@/components/ticket/inline-title";
import { QuickBar, TicketProperties } from "@/components/ticket/ticket-properties";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { requireUser } from "@/lib/auth-guards";
import { formatDateTime, timeAgo } from "@/lib/format";
import { parseTicketKey, ticketKey } from "@/lib/tickets";
import { getActivity } from "@/server/comments";
import { getTicketByKey } from "@/server/tickets";
import { listActiveUsers, listAllUserNames } from "@/server/users";

export async function generateMetadata({ params }: PageProps<"/tickets/[key]">): Promise<Metadata> {
  const key = decodeURIComponent((await params).key).toUpperCase();
  return { title: key };
}

function Stamp({ date }: { date: Date }) {
  return (
    <time dateTime={date.toISOString()} title={formatDateTime(date)}>
      {timeAgo(date)}
    </time>
  );
}

export default async function TicketPage({ params }: PageProps<"/tickets/[key]">) {
  const user = await requireUser();
  const rawKey = decodeURIComponent((await params).key);
  const parsed = parseTicketKey(rawKey);
  if (!parsed) notFound();
  const canonical = ticketKey(parsed.projectKey, parsed.number);
  if (rawKey !== canonical) redirect(`/tickets/${canonical}`);

  const detail = await getTicketByKey(canonical);
  if (!detail) notFound();
  const { ticket, project, reporter, assignee } = detail;

  const [activity, activeUsers, allNames] = await Promise.all([
    getActivity(ticket.id),
    listActiveUsers(),
    listAllUserNames(),
  ]);
  const names = new Map(allNames.map((u) => [u.id, u.name]));
  // An inactive assignee stays visible in the picker until someone changes it.
  const users =
    assignee && !activeUsers.some((u) => u.id === assignee.id)
      ? [...activeUsers, { id: assignee.id, name: `${assignee.name} (inactive)` }]
      : activeUsers;

  const values = {
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    assigneeId: ticket.assigneeId,
    dueDate: ticket.dueDate,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/tickets" className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Tickets</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href={`/tickets?project=${project.key}`} className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{project.name}</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span aria-current="page" className="font-mono text-xs font-medium text-terracotta">{canonical}</span>
        <Button variant="ghost" size="sm" className="ml-auto" nativeButton={false} render={<Link href={`/tickets/${canonical}/edit`} />}>
          <Pencil aria-hidden="true" /> Edit
        </Button>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            <InlineTitle key={ticket.title} ticketId={ticket.id} title={ticket.title} />
            <QuickBar ticketId={ticket.id} values={values} users={users} currentUserId={user.id} />
          </div>

          <InlineDescription key={ticket.updatedAt.getTime()} ticketId={ticket.id} description={ticket.description} />

          <aside className="rounded-xl border bg-card p-3 lg:hidden" aria-label="Properties">
            <TicketProperties ticketId={ticket.id} values={values} users={users} meta={[]} />
          </aside>

          <section aria-labelledby="activity-heading" className="space-y-4 border-t pt-6">
            <h2 id="activity-heading" className="text-lg font-semibold">Activity</h2>
            <ActivityTimeline items={activity} names={names} created={{ at: ticket.createdAt, by: reporter }} />
            <div className="pl-9">
              <CommentForm ticketId={ticket.id} />
            </div>
          </section>
        </div>

        <aside className="hidden lg:block" aria-label="Properties">
          <div className="sticky top-8 space-y-4 rounded-xl border bg-card p-3">
            <TicketProperties
              ticketId={ticket.id}
              values={values}
              users={users}
              meta={[
                {
                  label: "Reporter",
                  value: (
                    <span className="flex items-center gap-2">
                      <UserAvatar user={reporter} className="size-5" /> {reporter.name}
                    </span>
                  ),
                },
                { label: "Created", value: <Stamp date={ticket.createdAt} /> },
                { label: "Updated", value: <Stamp date={ticket.updatedAt} /> },
                ...(ticket.closedAt ? [{ label: "Closed", value: <Stamp date={ticket.closedAt} /> }] : []),
              ]}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
