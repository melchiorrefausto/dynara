import { cn } from "@/lib/utils";

export function DynaraLogo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-slate-950">
        <div className="h-3.5 w-3.5 rounded-full bg-white" />
      </div>
      {!markOnly ? <span className="text-xl font-bold tracking-normal">Dynara</span> : null}
    </div>
  );
}
