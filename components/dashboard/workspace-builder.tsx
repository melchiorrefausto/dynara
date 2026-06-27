"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ExternalLink, Figma, Loader2, Plus, RefreshCw, Sparkles, Trash2, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceRenderer } from "@/components/workspace/workspace-renderer";
import {
  addActivity,
  applySuggestion,
  applyWorkspaceAction,
  createBlankWorkspace,
  exportWorkspaceFile,
  type WorkspacePreferences
} from "@/lib/dashboard/workspace-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdapterPrimitive, ConnectedApp, WorkspaceAction, WorkspaceSchema } from "@/types/workspace";

type FigmaPrimitiveContext = {
  fileKey: string;
  fileName: string;
  primitives: AdapterPrimitive[];
  summary: string;
};

export function WorkspaceBuilder({
  activeApp,
  activeWorkspace,
  connectedApps,
  preferences,
  workspaces,
  onCreateWorkspace,
  onSelectWorkspace,
  selectedApp,
  onSelectApp,
  onToggleApp,
  onDeleteWorkspace,
  onUpdateWorkspace,
  onUpsertWorkspace
}: {
  activeApp: ConnectedApp;
  activeWorkspace?: WorkspaceSchema;
  connectedApps: ConnectedApp[];
  preferences: WorkspacePreferences;
  workspaces: WorkspaceSchema[];
  onCreateWorkspace: () => void;
  onSelectWorkspace: (id: string) => void;
  selectedApp?: ConnectedApp;
  onSelectApp: (id: string) => void;
  onToggleApp: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onUpdateWorkspace: (workspace: WorkspaceSchema) => void;
  onUpsertWorkspace: (workspace: WorkspaceSchema, activate?: boolean) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [figmaFileUrl, setFigmaFileUrl] = useState("");
  const [figmaSyncing, setFigmaSyncing] = useState(false);
  const [figmaError, setFigmaError] = useState<string | null>(null);
  const [figmaContext, setFigmaContext] = useState<FigmaPrimitiveContext | null>(null);
  const connectedCount = connectedApps.filter((app) => app.status === "connected").length;
  const figmaApp = connectedApps.find((app) => app.id === "figma");
  const figmaConnected = figmaApp?.status === "connected";

  async function loadFigmaPrimitives() {
    if (!figmaFileUrl.trim()) {
      setFigmaError("Paste a Figma file URL first.");
      return;
    }

    setFigmaSyncing(true);
    setFigmaError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;

      if (!session?.access_token) {
        setFigmaError("Sign in first.");
        return;
      }

      // Step 1: load primitives from Figma
      const primRes = await fetch("/api/figma/primitives", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fileUrl: figmaFileUrl.trim() })
      });

      const primPayload = (await primRes.json().catch(() => ({}))) as Partial<FigmaPrimitiveContext> & { error?: string };

      if (!primRes.ok || !primPayload.primitives) {
        setFigmaError(primPayload.error ?? "Could not load Figma primitives.");
        return;
      }

      const ctx = primPayload as FigmaPrimitiveContext;
      setFigmaContext(ctx);

      // Step 2: generate workspace using primitives + current prompt as intent
      const genRes = await fetch("/api/generate-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() || `Create a workspace for ${ctx.fileName}`, primitives: ctx.primitives })
      });

      const genPayload = (await genRes.json().catch(() => ({}))) as { schema?: WorkspaceSchema };
      if (!genPayload.schema) {
        setFigmaError("Workspace generation failed.");
        return;
      }

      const workspace: WorkspaceSchema = {
        ...genPayload.schema,
        id: activeWorkspace?.id ?? `figma-${Date.now()}`,
        savedAt: new Date().toISOString()
      };

      const withActivity = addActivity(
        workspace,
        `Generated workspace from ${ctx.fileName} — ${ctx.primitives.filter((p) => p.metadata?.kind === "component").length} components loaded`,
        "Figma"
      );

      onUpsertWorkspace(withActivity);
    } finally {
      setFigmaSyncing(false);
    }
  }

  async function generateWorkspace() {
    const requestPrompt = prompt.trim() || "Create a blank Dynara workspace";
    setLoading(true);
    try {
      const response = await fetch("/api/generate-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestPrompt })
      });
      const payload = (await response.json()) as { schema: WorkspaceSchema };
      const generated = addActivity(payload.schema, "Generated workspace from prompt", "AI");

      if (preferences.autoSaveGenerated || !activeWorkspace) {
        onUpsertWorkspace(generated);
      } else {
        onUpdateWorkspace(generated);
      }
    } catch {
      const generated = addActivity(
        createBlankWorkspace(requestPrompt ? `${requestPrompt.split(/\s+/).slice(0, 4).join(" ")} Workspace` : "Untitled Workspace"),
        "Created blank workspace after generation failed",
        "Dynara"
      );
      onUpsertWorkspace(generated);
    } finally {
      setLoading(false);
    }
  }

  function saveWorkspaceCopy() {
    if (!activeWorkspace) {
      return;
    }

    onUpsertWorkspace({
      ...activeWorkspace,
      id: `${activeWorkspace.id}-copy-${Date.now()}`,
      name: `${activeWorkspace.name} Copy`,
      source: "generated",
      savedAt: new Date().toISOString()
    });
  }

  function runAction(action: WorkspaceAction) {
    if (!activeWorkspace) {
      return;
    }

    if (action.id === "export-report") {
      exportWorkspaceFile(activeWorkspace);
      onUpdateWorkspace(addActivity(activeWorkspace, "Exported workspace report", "Dynara"));
      return;
    }

    onUpdateWorkspace(applyWorkspaceAction(activeWorkspace, action));
  }

  function runSuggestion(suggestionId: string, title: string) {
    if (!activeWorkspace) {
      return;
    }

    onUpdateWorkspace(applySuggestion(activeWorkspace, suggestionId, title));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm lg:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-normal text-slate-950">Design your perfect workspace</h1>
                <p className="mt-2 text-base text-muted-foreground">
                  Describe what you need, and Dynara will build a schema-driven workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={saveWorkspaceCopy}>
                  <Sparkles className="h-4 w-4" />
                  Save copy
                </Button>
                <Button variant="secondary" onClick={onCreateWorkspace}>
                  New blank
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-slate-50 p-3">
              <div className="flex flex-col gap-3 lg:flex-row">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the workspace you want to create..."
                  className="min-h-[92px] flex-1 resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <Button className="h-12 shrink-0 px-4 lg:w-auto" onClick={generateWorkspace} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Workspace
                    </>
                  )}
                </Button>
              </div>
              {loading ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI is composing your workspace...
                </p>
              ) : null}
            </div>

            {!activeWorkspace ? (
              <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm leading-6 text-slate-700">
                No workspace exists yet. Generate from your prompt or create a blank workspace to start from scratch.
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">Active context</p>

            {figmaConnected ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Figma connected
                </div>

                {figmaContext ? (
                  <div className="rounded-lg bg-primary/5 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{figmaContext.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{figmaContext.summary}</p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Figma file</label>
                  <div className="relative">
                    <Input
                      value={figmaFileUrl}
                      onChange={(e) => { setFigmaFileUrl(e.target.value); setFigmaError(null); }}
                      placeholder="Paste any Figma URL…"
                      className="pr-20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text.includes("figma.com")) { setFigmaFileUrl(text.trim()); setFigmaError(null); }
                          else setFigmaError("Clipboard doesn't contain a Figma URL.");
                        } catch { setFigmaError("Allow clipboard access to use this."); }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                    >
                      Paste
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In Figma: open any file → copy the URL from your browser → paste here. Works with any Figma URL.
                  </p>
                </div>

                {figmaError ? (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {figmaError}
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  onClick={loadFigmaPrimitives}
                  disabled={figmaSyncing || !figmaFileUrl.trim()}
                >
                  {figmaSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading primitives…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {figmaContext ? "Re-generate workspace" : "Generate workspace from Figma"}
                    </>
                  )}
                </Button>

                <a
                  href="https://www.figma.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  Open Figma
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {activeApp?.status === "connected" ? (
                  <div className="space-y-3 text-sm">
                    <ContextRow label="Connector" value={activeApp.name} success />
                    <ContextRow label="Last sync" value={activeApp.lastSync ?? "just now"} success />
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">
                    <Unplug className="mb-3 h-5 w-5 text-slate-400" />
                    Connect an app from the sidebar or settings to activate workspace context.
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-slate-700">Connected apps</span>
              <Badge tone={connectedCount > 0 ? "green" : "gray"}>{connectedCount}</Badge>
            </div>
          </div>
        </div>
      </section>

      {selectedApp ? (
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">App connection</p>
              <h2 className="mt-2 text-xl font-bold tracking-normal">{selectedApp.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedApp.status === "connected"
                  ? `${selectedApp.name} is connected and available as workspace context.`
                  : `Connect ${selectedApp.name} before using it as workspace context.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedApp.status === "connected" ? "secondary" : "default"}
                onClick={() => onToggleApp(selectedApp.id)}
              >
                {selectedApp.status === "connected" ? "Disconnect" : `Connect ${selectedApp.name}`}
              </Button>
              {selectedApp.status === "connected" ? (
                <Button variant="secondary" onClick={() => onSelectApp(selectedApp.id)}>
                  Configure
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {activeWorkspace ? (
      <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
              <Figma className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-normal text-slate-950">{activeWorkspace.name}</h2>
              <p className="text-sm text-muted-foreground">{activeWorkspace.description}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <Badge tone={activeWorkspace.source === "generated" ? "purple" : "blue"}>
              Workspace
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDeleteWorkspace(activeWorkspace.id)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <button
              onClick={() => setTemplateMenuOpen((open) => !open)}
              className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Switch workspace
              <ChevronDown className="h-4 w-4" />
            </button>
            {templateMenuOpen ? (
              <div className="absolute right-0 top-11 z-10 w-72 rounded-lg border border-border bg-white p-2 shadow-soft">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50">
                    <button
                      onClick={() => {
                        onSelectWorkspace(workspace.id);
                        setTemplateMenuOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center justify-between text-left text-sm font-semibold"
                    >
                      <span className="truncate">{workspace.name}</span>
                      {workspace.id === activeWorkspace.id ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                    </button>
                    <button
                      aria-label={`Delete ${workspace.name}`}
                      onClick={() => onDeleteWorkspace(workspace.id)}
                      className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {workspaces.length === 0 ? (
                  <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">No saved workspaces yet.</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <WorkspaceRenderer
          schema={activeWorkspace}
          showSuggestions={preferences.showSuggestions}
          onAction={runAction}
          onSuggestionAction={runSuggestion}
        />
      </section>
      ) : null}
    </div>
  );
}

function ContextRow({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="flex items-center gap-2 font-semibold text-slate-800">
        {value}
        {success ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
      </span>
    </div>
  );
}
