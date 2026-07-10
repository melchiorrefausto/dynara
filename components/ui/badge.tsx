import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "purple" | "green" | "amber" | "red" | "blue" | "gray";
};

const tones = {
  purple: "bg-primary/10 text-primary",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  gray: "bg-slate-100 text-slate-600"
};

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
