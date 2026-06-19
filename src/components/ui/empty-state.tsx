import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Estado vacío de marca: borde discontinuo + icono en chip + título/subtítulo + CTA.
 * Sustituye los "No hay datos" secos. Microcopy cálido (ver design system).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[var(--lino)] bg-[var(--blanco-calido)]/60 px-6 py-14 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--salvia-tint)] text-[var(--oliva)]">
          <Icon size={22} strokeWidth={1.75} />
        </span>
      )}
      <h3 className="font-display text-base font-semibold text-[var(--tinta)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--tinta-suave)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
