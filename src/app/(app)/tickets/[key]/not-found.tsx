import { TicketX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function TicketNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <EmptyState
        icon={TicketX}
        title="We couldn't find that ticket"
        action={<Button variant="outline" nativeButton={false} render={<Link href="/tickets" />}>Back to tickets</Button>}
      >
        It may have a different key, or the link has a typo.
      </EmptyState>
    </div>
  );
}
