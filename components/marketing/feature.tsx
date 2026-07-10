import type { LucideIcon } from "lucide-react";

export function Feature({
  icon: Icon,
  title,
  children
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-600">{children}</p>
      </div>
    </div>
  );
}
