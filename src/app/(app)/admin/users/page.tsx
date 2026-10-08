import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { requireAdmin } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import { listUsersForAdmin } from "@/server/admin";
import { AddUserButton, UserRowActions } from "./user-controls";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const people = await listUsersForAdmin();
  const active = people.filter((p) => p.isActive).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader
        title="People"
        description={`${active} active of ${people.length}. Deactivated people can't sign in, but their history stays.`}
        actions={<AddUserButton />}
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">Team members</caption>
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Name</th>
              <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Role</th>
              <th scope="col" className="hidden px-4 py-2 font-medium md:table-cell">Open tickets</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
              <th scope="col" className="px-4 py-2 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((p) => (
              <tr key={p.id} className={cn("transition-colors hover:bg-muted/40", !p.isActive && "text-muted-foreground")}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={p} className={cn(!p.isActive && "opacity-50 grayscale")} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.name}
                        {p.id === admin.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  {p.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <ShieldCheck className="size-3.5" aria-hidden="true" /> Admin
                    </span>
                  ) : (
                    <span className="text-xs">Developer</span>
                  )}
                </td>
                <td className="hidden px-4 py-2.5 tabular-nums md:table-cell">{p.openTickets}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("inline-flex items-center gap-1.5 text-xs", p.isActive ? "text-status-done" : "text-muted-foreground")}>
                    <span className={cn("size-1.5 rounded-full", p.isActive ? "bg-status-done" : "bg-muted-foreground/50")} aria-hidden="true" />
                    {p.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <UserRowActions
                    user={{ id: p.id, name: p.name, email: p.email, role: p.role, isActive: p.isActive }}
                    isSelf={p.id === admin.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
