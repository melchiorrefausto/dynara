import { Badge } from "@/components/ui/badge";

export function DeveloperStep({
  badge,
  title,
  body,
  code
}: {
  badge: string;
  title: string;
  body: string;
  code: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
      <Badge tone="gray">{badge}</Badge>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <pre className="mt-auto overflow-x-auto rounded-md bg-slate-950 p-3 pt-4 text-xs leading-6 text-slate-200">
        {code}
      </pre>
    </div>
  );
}
