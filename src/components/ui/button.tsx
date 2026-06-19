"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-[180ms] ease-out active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oliva)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "gradient-brand text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,.55)] hover:brightness-[1.06] rounded-[12px]",
        destructive:
          "bg-[var(--error)]/12 text-[var(--error)] hover:bg-[var(--error)]/20 rounded-[12px]",
        outline:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] rounded-[12px]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] rounded-[12px]",
        terracota:
          "bg-[var(--terracota)] text-white hover:bg-[var(--terracota)]/90 rounded-[12px]",
        ghost:
          "text-[var(--tinta)] hover:bg-[var(--arena)] rounded-[12px]",
        link:
          "text-[var(--oliva)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-7 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
