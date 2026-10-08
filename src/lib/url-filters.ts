import type { TicketFilters } from "@/lib/validation";

export const DEFAULT_SORT = { sort: "updated", dir: "desc" } as const;

/** Canonical query string for a filter set (defaults omitted, so URLs stay short). */
export function filtersToQuery(f: Partial<TicketFilters>) {
  const params = new URLSearchParams();
  for (const key of ["status", "priority", "type", "project", "assignee"] as const) {
    const values = f[key];
    if (values?.length) params.set(key, values.join(","));
  }
  if (f.q) params.set("q", f.q);
  if (f.sort && f.sort !== DEFAULT_SORT.sort) params.set("sort", f.sort);
  if (f.dir && f.dir !== DEFAULT_SORT.dir) params.set("dir", f.dir);
  if (f.page && f.page > 1) params.set("page", String(f.page));
  return params.toString();
}

export function ticketsHref(f: Partial<TicketFilters>) {
  const qs = filtersToQuery(f);
  return qs ? `/tickets?${qs}` : "/tickets";
}

export function hasActiveFilters(f: TicketFilters) {
  return Boolean(
    f.status.length || f.priority.length || f.type.length || f.project.length || f.assignee.length || f.q,
  );
}
