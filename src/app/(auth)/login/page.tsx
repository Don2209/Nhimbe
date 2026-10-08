import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth-guards";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        {/* Layered contour lines evoke granite kopjes at dusk. */}
        <svg
          className="absolute inset-0 size-full opacity-[0.14]"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
        >
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M-50 ${520 + i * 22} C 120 ${430 + i * 20}, 230 ${560 + i * 18}, 360 ${470 + i * 21} S 560 ${430 + i * 24}, 680 ${500 + i * 20}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ))}
        </svg>
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-terracotta/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <LogoMark className="size-9 [&_rect]:fill-primary-foreground/10" />
          <span className="font-heading text-2xl font-semibold">Nhimbe</span>
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="font-heading text-4xl leading-tight font-medium">
            Many hands, one field.
          </p>
          <p className="text-primary-foreground/75">
            A <em>nhimbe</em> is when neighbours gather to finish a job
            together. This is where our team keeps track of the work.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark />
            <span className="font-heading text-xl font-semibold">Nhimbe</span>
          </div>
          <h1 className="text-display font-semibold">Welcome back</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">
            Sign in with your team account.
          </p>
          <LoginForm
            callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/"}
          />
        </div>
      </section>
    </main>
  );
}
