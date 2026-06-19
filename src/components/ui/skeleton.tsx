import * as React from "react";
import { cn } from "@/lib/utils";

/** Bloque de carga. Mantiene altura para evitar CLS; sustituye spinners en listas. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[10px] bg-[var(--arena)]", className)}
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-5"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({
  rows = 6,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)]",
        className
      )}
    >
      <div className="border-b border-[var(--lino)] p-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-[var(--lino)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4 flex-1"
                style={{ maxWidth: c === 0 ? "30%" : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCards, SkeletonTable };
