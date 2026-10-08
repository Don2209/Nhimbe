import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8" aria-busy="true" aria-label="Loading ticket">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-8 h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="hidden h-72 rounded-xl lg:block" />
      </div>
    </div>
  );
}
