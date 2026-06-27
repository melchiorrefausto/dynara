import { cn } from "@/lib/utils";

export function DynaraLogo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="absolute h-4 w-4 rounded-md bg-primary" />
        <div className="absolute h-4 w-4 rotate-45 rounded-md bg-sky-300 mix-blend-multiply" />
        <div className="absolute h-2.5 w-2.5 rounded-full bg-white" />
      </div>
      {!markOnly ? <span className="text-xl font-bold tracking-normal">Dynara</span> : null}
    </div>
  );
}
