import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
