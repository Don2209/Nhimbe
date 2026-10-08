import { ArrowRight, Sparkles, Sun, UserRoundX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_META } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { TicketList } from "@/components/ticket-list";
import { requireUser } from "@/lib/auth-guards";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { ticketsHref } from "@/lib/url-filters";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/server/tickets";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = new Date().getUTCHours() + 2; // Harare time (CAT, UTC+2)
  const h = hour % 24;
  if (h < 12) return "Mangwanani";
  if (h < 17) return "Masikati";
  return "Manheru";
}

function Section({
  title,
  href,
  count,
  children,
}: {
  title: string;
  href: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {title}
          {count !== undefined && <span className="ml-2 font-sans text-sm font-normal text-muted-foreground tabular-nums">{count}</span>}
        </h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          View all <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { mine, unassigned, recent, byStatus } = await getDashboard(user.id);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">
          <span lang="sn">{greeting()}</span>, {firstName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-display">Here&rsquo;s the field today</h1>
      </header>

      <ul className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Tickets by status">
        {STATUSES.map((s) => {
          const { icon: Icon, className } = STATUS_META[s];
          const tone = className.split(" ")[0];
          return (
            <li key={s}>
              <Link
                href={ticketsHref({ status: [s] })}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all outline-none hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={cn("flex items-center gap-1.5 text-xs font-medium", tone)}>
                  <Icon className="size-3.5" aria-hidden="true" />
                  {STATUS_LABELS[s]}
                </span>
                <span className="font-heading text-3xl font-semibold tabular-nums">{byStatus[s] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-10 xl:grid-cols-2">
        <Section
          title="My open tickets"
          count={mine.length}
          href={ticketsHref({ assignee: ["me"], status: ["open", "in_progress", "in_review"], sort: "priority" })}
        >
          {mine.length ? (
            <TicketList tickets={mine} compact />
          ) : (
            <EmptyState icon={Sun} title="Your plate is clear">
              Nothing assigned to you right now. Pick something up from the unassigned pile.
            </EmptyState>
          )}
        </Section>

        <Section
          title="Unassigned"
          count={unassigned.length}
          href={ticketsHref({ assignee: ["none"], status: ["open", "in_progress", "in_review"] })}
        >
          {unassigned.length ? (
            <TicketList tickets={unassigned} compact />
          ) : (
            <EmptyState icon={UserRoundX} title="Everything has an owner">
              Every open ticket is in someone&rsquo;s hands.
            </EmptyState>
          )}
        </Section>

        <Section title="Recently updated" href={ticketsHref({ sort: "updated" })}>
          {recent.length ? (
            <TicketList tickets={recent} compact />
          ) : (
            <EmptyState icon={Sparkles} title="A quiet start">
              No tickets yet. Press <kbd className="rounded border px-1 font-mono text-xs">C</kbd> to create the first one.
            </EmptyState>
          )}
        </Section>
      </div>

    </div>
  );
}
