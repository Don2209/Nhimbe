import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCreateForm } from "@/components/project-create-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import { listProjectsWithCounts } from "@/server/projects";
import { AddProjectButton, ProjectRowActions } from "./project-controls";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireUser();
  const projects = await listProjectsWithCounts();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader
        title="Projects"
        description="Archived projects keep their tickets but stop accepting new ones."
        actions={<AddProjectButton />}
      />
      {projects.length === 0 ? (
        <section className="max-w-md rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <FolderPlus className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Create your first project</h2>
              <p className="text-sm text-muted-foreground">Projects group related tickets. A name is all you need.</p>
            </div>
          </div>
          <ProjectCreateForm />
        </section>
      ) : (
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
                    <ProjectRowActions project={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
