"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "amber" | "green" | "red" | "slate";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  amber: "bg-primary/10 text-primary border-primary/20",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  slate: "bg-slate-700/50 text-slate-300 border-slate-600",
};

function Badge({ variant = "amber", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-display",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
