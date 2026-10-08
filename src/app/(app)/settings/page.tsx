import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { requireUser } from "@/lib/auth-guards";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[14rem_1fr] md:gap-8" aria-labelledby={`${title}-h`}>
      <div>
        <h2 id={`${title}-h`} className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="max-w-md">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <PageHeader title="Your profile" description="How the team sees you, and how you sign in." />
      <div className="mb-6 flex items-center gap-3">
        <UserAvatar user={user} className="size-10 text-sm" />
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>
      <div className="space-y-6">
        <Panel title="Profile" description="Your name appears on tickets, comments and history.">
          <ProfileForm name={user.name} email={user.email} />
        </Panel>
        <Panel title="Password" description="You'll need your current password to set a new one.">
          <PasswordForm />
        </Panel>
      </div>
    </div>
  );
}
