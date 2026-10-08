import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ShortcutsProvider } from "@/components/shortcuts-provider";
import { requireUser } from "@/lib/auth-guards";
import { listProjects } from "@/server/projects";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const projects = await listProjects();

  return (
    <ShortcutsProvider>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <Suspense>
          <AppSidebar
            user={user}
            projects={projects.map(({ id, key, name }) => ({ id, key, name }))}
          />
        </Suspense>
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </ShortcutsProvider>
  );
}
