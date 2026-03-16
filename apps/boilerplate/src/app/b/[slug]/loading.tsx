import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Skeleton className="h-10 w-32" />

      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex rounded-lg border">
            <div className="flex flex-col items-center gap-1 border-r px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="flex-1 space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
