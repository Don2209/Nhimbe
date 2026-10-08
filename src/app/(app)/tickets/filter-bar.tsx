"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PRIORITY_META, STATUS_META, TYPE_META } from "@/components/badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  TICKET_TYPES,
  TYPE_LABELS,
} from "@/lib/constants";
import { hasActiveFilters, ticketsHref } from "@/lib/url-filters";
import { cn } from "@/lib/utils";
import type { SortField, TicketFilters } from "@/lib/validation";

type Option = { value: string; label: string; icon?: React.ReactNode };
type FacetKey = "status" | "priority" | "type" | "project" | "assignee";

const SORT_LABELS: Record<SortField, string> = {
  updated: "Last updated",
  created: "Created",
  priority: "Priority",
  status: "Status",
  due: "Due date",
  number: "Number",
  title: "Title",
};

function Facet({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const active = selected.length > 0;
  const summary =
    selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label
      : selected.length > 1
        ? `${selected.length} selected`
        : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1 border-dashed",
              active && "border-solid border-primary/40 bg-primary/5 text-foreground",
            )}
          />
        }
      >
        {label}
        {summary && (
          <>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <span className="max-w-32 truncate font-normal">{summary}</span>
          </>
        )}
        <ChevronDown className="text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by {label.toLowerCase()}</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={selected.includes(o.value)}
              closeOnClick={false}
              onCheckedChange={(checked) =>
                onChange(
                  checked ? [...selected, o.value] : selected.filter((v) => v !== o.value),
                )
              }
            >
              {o.icon}
              <span className="truncate">{o.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onChange([])}>
                <X aria-hidden="true" />
                Clear
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({
  filters,
  projects,
  users,
}: {
  filters: TicketFilters;
  projects: { key: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const lastPushed = useRef(filters.q);

  function apply(next: Partial<TicketFilters>) {
    const href = ticketsHref({ ...filters, ...next, page: 1 });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  // Debounce typing into the search box; keep it in sync with back/forward.
  useEffect(() => {
    if (query === lastPushed.current) return;
    const handle = setTimeout(() => {
      lastPushed.current = query;
      apply({ q: query.trim() });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (filters.q !== lastPushed.current) {
      lastPushed.current = filters.q;
      setQuery(filters.q);
    }
  }, [filters.q]);

  const facets: { key: FacetKey; label: string; options: Option[] }[] = [
    {
      key: "status",
      label: "Status",
      options: STATUSES.map((s) => {
        const { icon: Icon, className } = STATUS_META[s];
        return { value: s, label: STATUS_LABELS[s], icon: <Icon className={className.split(" ")[0]} aria-hidden="true" /> };
      }),
    },
    {
      key: "priority",
      label: "Priority",
      options: PRIORITIES.map((p) => {
        const { icon: Icon, className } = PRIORITY_META[p];
        return { value: p, label: PRIORITY_LABELS[p], icon: <Icon className={className.split(" ")[0]} aria-hidden="true" /> };
      }),
    },
    {
      key: "type",
      label: "Type",
      options: TICKET_TYPES.map((t) => {
        const { icon: Icon } = TYPE_META[t];
        return { value: t, label: TYPE_LABELS[t], icon: <Icon className="text-muted-foreground" aria-hidden="true" /> };
      }),
    },
    {
      key: "project",
      label: "Project",
      options: projects.map((p) => ({
        value: p.key,
        label: p.name,
        icon: <span className="w-8 font-mono text-[0.625rem] font-semibold text-terracotta">{p.key}</span>,
      })),
    },
    {
      key: "assignee",
      label: "Assignee",
      options: [
        { value: "me", label: "Me" },
        { value: "none", label: "Unassigned" },
        ...users.map((u) => ({ value: u.id, label: u.name })),
      ],
    },
  ];

  const active = hasActiveFilters(filters);
  const SortIcon = filters.dir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <div className="flex flex-col gap-3" role="search" aria-label="Filter tickets">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and descriptions"
            aria-label="Search tickets"
            className="h-8 bg-card pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
            <SortIcon aria-hidden="true" />
            <span className="hidden sm:inline">{SORT_LABELS[filters.sort]}</span>
            <span className="sr-only sm:hidden">Sort: {SORT_LABELS[filters.sort]}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filters.sort}
                onValueChange={(v) => apply({ sort: v as SortField })}
              >
                {(Object.keys(SORT_LABELS) as SortField[]).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s} closeOnClick>
                    {SORT_LABELS[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Direction</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filters.dir}
                onValueChange={(v) => apply({ dir: v as "asc" | "desc" })}
              >
                <DropdownMenuRadioItem value="desc" closeOnClick>Descending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="asc" closeOnClick>Ascending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {facets.map((f) => (
          <Facet
            key={f.key}
            label={f.label}
            options={f.options}
            selected={filters[f.key] as string[]}
            onChange={(values) => apply({ [f.key]: values })}
          />
        ))}
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              lastPushed.current = "";
              setQuery("");
              startTransition(() => router.replace(ticketsHref({ sort: filters.sort, dir: filters.dir }), { scroll: false }));
            }}
          >
            <X aria-hidden="true" />
            Clear all
          </Button>
        )}
        <span aria-live="polite" className="ml-1 inline-flex items-center text-xs text-muted-foreground">
          {pending && (
            <>
              <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden="true" /> Updating…
            </>
          )}
        </span>
      </div>
    </div>
  );
}

