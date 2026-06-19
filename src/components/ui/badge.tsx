import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]",
        oliva: "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]",
        terracota: "bg-[var(--terracota-tint)] text-[var(--terracota)]",
        exito: "bg-[var(--exito-tint)] text-[var(--exito)]",
        aviso: "bg-[var(--aviso-tint)] text-[var(--aviso)]",
        error: "bg-[var(--error-tint)] text-[var(--error)]",
        info: "bg-[var(--info-tint)] text-[var(--info)]",
        muted: "bg-[var(--arena)] text-[var(--tinta-suave)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
