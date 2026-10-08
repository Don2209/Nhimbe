"use client";

import { ArrowRight, Home, ListTodo, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchTicketsAction, type PaletteTicket } from "@/actions/tickets";
import { StatusIcon } from "@/components/badges";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { parseTicketKey } from "@/lib/tickets";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteTicket[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let stale = false;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const found = await searchTicketsAction(query);
        if (!stale) setResults(found);
      });
    }, 150);
    return () => {
      stale = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  function go(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  const exactKey = parseTicketKey(query);
  const exactLabel = exactKey && `${exactKey.projectKey}-${exactKey.number}`;
  const showExact = exactLabel && !results.some((r) => r.key === exactLabel);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      title="Command palette"
      description="Jump to a ticket or create one"
    >
      <Command shouldFilter={false} loop>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search tickets by key or title…"
          aria-label="Search tickets"
        />
        <CommandList className="max-h-96">
          {showExact && (
            <CommandGroup heading="Go to">
              <CommandItem value={`go-${exactLabel}`} onSelect={() => go(`/tickets/${exactLabel}`)}>
                <ArrowRight aria-hidden="true" />
                Open <span className="font-mono">{exactLabel}</span>
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading={query ? "Matching tickets" : "Recently updated"}>
            {results.map((t) => (
              <CommandItem key={t.id} value={t.key} onSelect={() => go(`/tickets/${t.key}`)}>
                <StatusIcon status={t.status} />
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{t.key}</span>
                <span className="truncate">{t.title}</span>
              </CommandItem>
            ))}
            {!pending && results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No tickets match “{query}”.
              </p>
            )}
            {pending && results.length === 0 && (
              <p className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Searching…
              </p>
            )}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem value="create-ticket" onSelect={() => go("/tickets/new")}>
              <Plus aria-hidden="true" />
              Create ticket
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
            <CommandItem value="nav-dashboard" onSelect={() => go("/")}>
              <Home aria-hidden="true" />
              Go to dashboard
            </CommandItem>
            <CommandItem value="nav-tickets" onSelect={() => go("/tickets")}>
              <ListTodo aria-hidden="true" />
              Go to all tickets
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
