import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import { listProjectsForAdmin } from "@/server/admin";
import { AddProjectButton, ProjectRowActions } from "./project-controls";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await listProjectsForAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader
        title="Projects"
        description="Archived projects keep their tickets but stop accepting new ones."
        actions={<AddProjectButton />}
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">Projects</caption>
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Key</th>
              <th scope="col" className="px-4 py-2 font-medium">Name</th>
              <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Tickets</th>
              <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Status</th>
              <th scope="col" className="px-4 py-2 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p) => (
              <tr key={p.id} className={cn("transition-colors hover:bg-muted/40", p.isArchived && "text-muted-foreground")}>
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-terracotta">{p.key}</td>
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/tickets?project=${p.key}`} className="rounded hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {p.name}
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 tabular-nums sm:table-cell">{p.ticketCount}</td>
                <td className="hidden px-4 py-2.5 text-xs sm:table-cell">{p.isArchived ? "Archived" : "Active"}</td>
                <td className="px-2 py-2.5">
                  <ProjectRowActions project={{ id: p.id, name: p.name, isArchived: p.isArchived }} />
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No projects yet. Create one to start collecting tickets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
