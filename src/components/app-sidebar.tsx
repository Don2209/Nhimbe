"use client";

import {
  FolderKanban,
  Home,
  Inbox,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { logout } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user-avatar";
import { useShortcuts } from "@/components/shortcuts-provider";
import type { SessionUser } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";

type ProjectLink = { id: string; key: string; name: string };

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 bg-card px-1 font-mono text-[0.625rem] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
  active,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 text-muted-foreground transition-colors group-hover:text-foreground",
          active && "text-primary",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function SidebarBody({
  user,
  projects,
  onNavigate,
}: {
  user: SessionUser;
  projects: ProjectLink[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { openPalette } = useShortcuts();
  const onTickets = pathname === "/tickets";
  const assignee = params.get("assignee");
  const project = params.get("project");
  const plainList = onTickets && !assignee && !project && params.size === 0;

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center justify-between px-1 pt-1">
        <Link href="/" onClick={onNavigate} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <Logo />
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          nativeButton={false}
          render={<Link href="/tickets/new" onClick={onNavigate} />}
          className="flex-1 justify-start"
        >
          <Plus aria-hidden="true" />
          New ticket
          <Kbd className="ml-auto border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground">C</Kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onNavigate?.();
            openPalette();
          }}
          aria-label="Search tickets (Ctrl+K)"
          title="Search (Ctrl/⌘ K)"
        >
          <Search aria-hidden="true" />
        </Button>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        <NavLink href="/" icon={Home} active={pathname === "/"} onNavigate={onNavigate}>
          Dashboard
        </NavLink>
        <NavLink href="/tickets" icon={ListTodo} active={plainList} onNavigate={onNavigate}>
          All tickets
        </NavLink>
        <NavLink
          href="/tickets?assignee=me&status=open,in_progress,in_review"
          icon={Inbox}
          active={onTickets && assignee === "me"}
          onNavigate={onNavigate}
        >
          My work
        </NavLink>
      </nav>

      {projects.length > 0 && (
        <nav aria-label="Projects" className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-2xs font-medium tracking-wider text-muted-foreground uppercase">
            Projects
          </p>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/tickets?project=${p.key}`}
              onClick={onNavigate}
              aria-current={onTickets && project === p.key ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                onTickets && project === p.key && "bg-sidebar-accent font-medium",
              )}
            >
              <span className="inline-flex h-5 min-w-9 items-center justify-center rounded bg-card px-1 font-mono text-[0.625rem] font-semibold text-terracotta ring-1 ring-border">
                {p.key}
              </span>
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </nav>
      )}

      {user.role === "admin" && (
        <nav aria-label="Admin" className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-2xs font-medium tracking-wider text-muted-foreground uppercase">
            Admin
          </p>
          <NavLink href="/admin/users" icon={Users} active={pathname.startsWith("/admin/users")} onNavigate={onNavigate}>
            Users
          </NavLink>
          <NavLink href="/admin/projects" icon={FolderKanban} active={pathname.startsWith("/admin/projects")} onNavigate={onNavigate}>
            Projects
          </NavLink>
        </nav>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              />
            }
          >
            <UserAvatar user={user} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{user.name}</span>
              <span className="block truncate text-2xs text-muted-foreground capitalize">{user.role}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppSidebar({ user, projects }: { user: SessionUser; projects: ProjectLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarBody user={user} projects={projects} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-sidebar/90 px-4 backdrop-blur md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}>
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody user={user} projects={projects} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
        <Button
          nativeButton={false}
          render={<Link href="/tickets/new" />}
          size="icon"
          className="ml-auto"
          aria-label="New ticket"
        >
          <Plus aria-hidden="true" />
        </Button>
      </header>
    </>
  );
}
