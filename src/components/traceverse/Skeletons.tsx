import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-secondary/60", className)} />;
}

export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-8 px-4 pt-6 lg:px-0">
      <div className="flex gap-4 rounded-3xl border border-border p-4">
        <Skeleton className="aspect-[2/3] w-28 shrink-0 sm:w-36" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      {[0, 1].map((r) => (
        <div key={r} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-36 shrink-0 space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
