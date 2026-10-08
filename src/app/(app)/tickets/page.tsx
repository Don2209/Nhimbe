import { ChevronLeft, ChevronRight, Plus, SearchX, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TicketList } from "@/components/ticket-list";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { PAGE_SIZE } from "@/lib/constants";
import { hasActiveFilters, ticketsHref } from "@/lib/url-filters";
import { ticketFiltersSchema } from "@/lib/validation";
import { listProjects } from "@/server/projects";
import { listTickets } from "@/server/tickets";
import { listActiveUsers } from "@/server/users";
import { FilterBar } from "./filter-bar";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  const user = await requireUser();
  const filters = ticketFiltersSchema.parse(await searchParams);
  const [{ rows, total }, projects, users] = await Promise.all([
    listTickets(filters, user.id),
    listProjects({ includeArchived: true }),
    listActiveUsers(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(filters.page * PAGE_SIZE, total);
  const filtered = hasActiveFilters(filters);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader
        title="Tickets"
        description={`${total} ${total === 1 ? "ticket" : "tickets"}${filtered ? " match this view" : " in all projects"}`}
        actions={
          <Button nativeButton={false} render={<Link href="/tickets/new" />}>
            <Plus aria-hidden="true" /> New ticket
          </Button>
        }
      />
      <FilterBar
        filters={filters}
        projects={projects.map((p) => ({ key: p.key, name: p.name }))}
        users={users}
      />

      <div className="mt-5">
        {rows.length > 0 ? (
          <TicketList tickets={rows} />
        ) : filtered ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches this view"
            action={
              <Button variant="outline" nativeButton={false} render={<Link href="/tickets" />}>
                Clear filters
              </Button>
            }
          >
            Try loosening a filter or searching for a different word.
          </EmptyState>
        ) : (
          <EmptyState
            icon={Ticket}
            title="No tickets yet"
            action={
              <Button nativeButton={false} render={<Link href="/tickets/new" />}>
                <Plus aria-hidden="true" /> Create the first one
              </Button>
            }
          >
            The field is clear. Every job starts with someone writing it down.
          </EmptyState>
        )}
      </div>

      {total > 0 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Showing <span className="font-medium text-foreground">{first}–{last}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <PageLink href={ticketsHref({ ...filters, page: filters.page - 1 })} disabled={filters.page <= 1} label="Previous page">
              <ChevronLeft aria-hidden="true" /> Prev
            </PageLink>
            <span className="tabular-nums">
              {filters.page} / {pages}
            </span>
            <PageLink href={ticketsHref({ ...filters, page: filters.page + 1 })} disabled={filters.page >= pages} label="Next page">
              Next <ChevronRight aria-hidden="true" />
            </PageLink>
          </div>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href} aria-label={label} />}>
      {children}
    </Button>
  );
}
