"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Code2,
  Download,
  FileSearch,
  Layers3,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ActivityBlock,
  DevHandoffBlock,
  DocumentationBlock,
  ListBlock,
  MetricBlock,
  PreviewBlock,
  QuickActionsBlock,
  SuggestionsBlock,
  TokenTableBlock,
  WorkspaceAction,
  WorkspaceBlock,
  WorkspaceSchema
} from "@/types/workspace";

const toneClasses = {
  purple: "from-primary/12 text-primary border-primary/20",
  blue: "from-sky-500/12 text-sky-700 border-sky-200",
  green: "from-emerald-500/12 text-emerald-700 border-emerald-200",
  amber: "from-amber-500/12 text-amber-700 border-amber-200",
  red: "from-red-500/12 text-red-700 border-red-200"
};

const actionIcons = {
  "scan-file": Search,
  cleanup: Sparkles,
  "sync-variables": RefreshCw,
  "export-report": Download
};

export function WorkspaceRenderer({
  schema,
  showSuggestions = true,
  onAction,
  onSuggestionAction
}: {
  schema: WorkspaceSchema;
  showSuggestions?: boolean;
  onAction?: (action: WorkspaceAction) => void;
  onSuggestionAction?: (suggestionId: string, title: string) => void;
}) {
  const metrics = schema.layout.filter((block): block is MetricBlock => block.type === "metric_card");
  const rest = schema.layout.filter((block) => block.type !== "metric_card");

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((block) => (
          <MetricCard key={`${block.title}-${block.value}`} block={block} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
        <div className="grid gap-5 lg:grid-cols-2">
          {rest
            .filter((block) => !["suggestions", "preview"].includes(block.type))
            .map((block) => (
              <BlockRenderer
                key={`${block.type}-${block.title}`}
                block={block}
                onAction={onAction}
                onSuggestionAction={onSuggestionAction}
              />
            ))}
        </div>

        <aside className="space-y-5">
          {rest
            .filter((block) => ["suggestions", "preview"].includes(block.type))
            .filter((block) => showSuggestions || block.type !== "suggestions")
            .map((block) => (
              <BlockRenderer
                key={`${block.type}-${block.title}`}
                block={block}
                onAction={onAction}
                onSuggestionAction={onSuggestionAction}
              />
            ))}
        </aside>
      </div>
    </section>
  );
}

function BlockRenderer({
  block,
  onAction,
  onSuggestionAction
}: {
  block: WorkspaceBlock;
  onAction?: (action: WorkspaceAction) => void;
  onSuggestionAction?: (suggestionId: string, title: string) => void;
}) {
  switch (block.type) {
    case "component_list":
    case "issue_list":
    case "list":
      return <ListPanel block={block} />;
    case "token_table":
      return <TokenTable block={block} />;
    case "suggestions":
      return <SuggestionsPanel block={block} onSuggestionAction={onSuggestionAction} />;
    case "activity_feed":
      return <ActivityFeed block={block} />;
    case "quick_actions":
      return <QuickActions block={block} onAction={onAction} />;
    case "dev_handoff":
      return <DevHandoffPanel block={block} />;
    case "documentation":
      return <DocumentationPanel block={block} />;
    case "preview":
      return <PreviewPanel block={block} />;
    default:
      return null;
  }
}

function MetricCard({ block }: { block: MetricBlock }) {
  const tone = block.tone ?? "purple";
  return (
    <Card className={cn("border bg-gradient-to-br from-white to-white", toneClasses[tone])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{block.title}</p>
            <p className="mt-2 text-3xl font-bold tracking-normal text-slate-950">{block.value}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm">
            <Layers3 className="h-5 w-5" />
          </div>
        </div>
        {block.trend ? <p className="mt-3 text-xs font-semibold text-slate-500">{block.trend}</p> : null}
      </CardContent>
    </Card>
  );
}

function ListPanel({ block }: { block: ListBlock }) {
  const icon = block.type === "issue_list" ? TriangleAlert : Layers3;
  const Icon = icon;
  const [selectedId, setSelectedId] = useState(block.items[0]?.id);
  const selectedItem = block.items.find((item) => item.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
        <Badge tone={block.type === "issue_list" ? "red" : "purple"}>{block.items.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary/30",
              selectedId === item.id && "border-primary/40 bg-primary/5"
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
              {item.subtitle ? <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p> : null}
            </div>
            {item.value ? <span className="text-sm font-bold text-primary">{item.value}</span> : null}
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        ))}
        {selectedItem ? (
          <div className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-900">{selectedItem.title}</span>
            {selectedItem.subtitle ? ` - ${selectedItem.subtitle}` : " is selected."}
          </div>
        ) : null}
        {block.actionLabel ? (
          <button className="mx-auto flex items-center gap-2 text-sm font-semibold text-primary">
            {block.actionLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TokenTable({ block }: { block: TokenTableBlock }) {
  const categories = ["Color", "Typography", "Spacing", "Radius", "Effect"] as const;
  const [category, setCategory] = useState<(typeof categories)[number]>("Color");
  const visibleItems = block.items.filter((item) => item.category === category);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
        <Badge tone="blue">{block.items.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 text-xs font-semibold text-muted-foreground">
          {categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={cn("rounded-md px-2 py-1", category === tab && "bg-primary/10 text-primary")}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border">
          {visibleItems.length > 0 ? visibleItems.map((token) => (
            <div key={token.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-md shadow-sm" style={{ backgroundColor: token.value }} />
                <span className="text-sm font-semibold text-slate-800">{token.name}</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{token.value}</span>
            </div>
          )) : (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">
              No {category.toLowerCase()} tokens in this workspace.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionsPanel({
  block,
  onSuggestionAction
}: {
  block: SuggestionsBlock;
  onSuggestionAction?: (suggestionId: string, title: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle>{block.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.items.length > 0 ? block.items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
              </div>
              {item.impact ? <Badge tone="purple">{item.impact}</Badge> : null}
            </div>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => onSuggestionAction?.(item.id, item.title)}>
              {item.actionLabel}
            </Button>
          </div>
        )) : (
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">
            All suggestions have been applied for this workspace.
          </div>
        )}
        <button className="mx-auto flex items-center gap-2 text-sm font-semibold text-primary">
          View all suggestions
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ block }: { block: ActivityBlock }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {block.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-bold text-primary">{item.actor}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.event}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions({
  block,
  onAction
}: {
  block: QuickActionsBlock;
  onAction?: (action: WorkspaceAction) => void;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {block.actions.map((action) => (
            <ActionButton key={action.id} action={action} onAction={onAction} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  action,
  onAction
}: {
  action: WorkspaceAction;
  onAction?: (action: WorkspaceAction) => void;
}) {
  const Icon = actionIcons[action.id as keyof typeof actionIcons] ?? FileSearch;
  return (
    <Button variant="secondary" className="h-12 justify-start" onClick={() => onAction?.(action)}>
      <Icon className="h-4 w-4" />
      {action.label}
    </Button>
  );
}

function DevHandoffPanel({ block }: { block: DevHandoffBlock }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <CardTitle>{block.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <StatusIcon status={item.status} />
            <div>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.count}</p>
            </div>
          </div>
        ))}
        <button className="mx-auto flex items-center gap-2 text-sm font-semibold text-primary">
          Open Dev Mode
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}

function DocumentationPanel({ block }: { block: DocumentationBlock }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {block.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <StatusIcon status={item.status === "missing" ? "review" : "ready"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PreviewPanel({ block }: { block: PreviewBlock }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.title}</CardTitle>
        <div className="flex gap-1 text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {block.components.map((component, index) => (
            <Button key={component} variant={index === 0 ? "default" : "secondary"}>
              {component}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status?: string }) {
  if (status === "ready" || status === "documented") {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />;
  }

  if (status === "blocked") {
    return <TriangleAlert className="h-5 w-5 shrink-0 text-red-500" />;
  }

  return <TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" />;
}
