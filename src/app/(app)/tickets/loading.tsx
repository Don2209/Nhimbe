import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10" aria-busy="true" aria-label="Loading tickets">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-2 mb-6 h-4 w-56" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>
      <div className="mt-5 divide-y rounded-xl border bg-card">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 - (i % 3) * 12}%` }} />
            <Skeleton className="ml-auto h-5 w-20" />
            <Skeleton className="size-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
