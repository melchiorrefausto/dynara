"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, FolderOpen, Plus, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeBlock } from "@/components/ui/code-block";
import {
  addAction,
  addPanel,
  addView,
  generateDynaraJson,
  generateScriptSnippet,
  removeAction,
  removePanel,
  removeView,
  slugify
} from "@/lib/dashboard/manifest-state";
import {
  applyPanelWrappers,
  collectSourceFiles,
  findIndexHtml,
  pickProjectDirectory,
  supportsFileSystemAccess,
  upsertScriptBlock,
  type ApplyResult,
  type DiscoveredFile
} from "@/lib/dashboard/fs-import";
import { cn } from "@/lib/utils";
import type { IntegrationManifest } from "@/types/manifest";

const COLOR_SWATCHES = ["#0f172a", "#2563eb", "#0d9488", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

type SuggestedPanel = { id: string; label: string; componentName?: string };
type ImportStatus = "idle" | "loading" | "done" | "error";
type ImportMode = "upload" | "folder";
type ApplyState = { status: "idle" | "applying" | "done" | "error"; message?: string; result?: ApplyResult };

export function IntegrationBuilder({
  manifest,
  onUpdateManifest
}: {
  manifest: IntegrationManifest;
  onUpdateManifest: (manifest: IntegrationManifest) => void;
}) {
  const [panelDraft, setPanelDraft] = useState({ label: "", selector: "" });
  const [viewDraft, setViewDraft] = useState({ label: "", panels: new Set<string>() });
  const [actionDraft, setActionDraft] = useState({ label: "" });
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importMode, setImportMode] = useState<ImportMode>("upload");
  const [importedFileNames, setImportedFileNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedPanel[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [folderFiles, setFolderFiles] = useState<DiscoveredFile[]>([]);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [indexHtmlHandle, setIndexHtmlHandle] = useState<FileSystemFileHandle | null>(null);
  const [analyzedFileHandle, setAnalyzedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [analyzedFilePath, setAnalyzedFilePath] = useState<string>("");
  const [applyState, setApplyState] = useState<ApplyState>({ status: "idle" });

  const dynaraJson = useMemo(() => generateDynaraJson(manifest), [manifest]);
  const scriptSnippet = useMemo(() => generateScriptSnippet(manifest), [manifest]);
  const isEmpty = manifest.panels.length === 0;

  async function runSuggestPanels(files: { name: string; content: string }[]) {
    setImportedFileNames(files.map((file) => file.name));
    setImportStatus("loading");
    setSuggestions([]);
    setApplyState({ status: "idle" });

    try {
      const res = await fetch("/api/suggest-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files })
      });
      const data = (await res.json()) as { panels?: SuggestedPanel[]; error?: string };
      if (!res.ok || !data.panels) throw new Error(data.error ?? "Could not analyze files.");

      const existingIds = new Set(manifest.panels.map((panel) => panel.id));
      const fresh = data.panels.filter((panel) => !existingIds.has(panel.id));
      setSuggestions(fresh);
      setSelectedSuggestionIds(new Set(fresh.map((panel) => panel.id)));
      setImportStatus("done");
    } catch {
      setImportStatus("error");
    }
  }

  async function analyzeFiles(fileList: FileList) {
    setImportMode("upload");
    const files = await Promise.all(
      Array.from(fileList)
        .slice(0, 6)
        .map(async (file) => ({ name: file.name, content: await file.text() }))
    );
    await runSuggestPanels(files);
  }

  async function openProjectFolder() {
    setFolderError(null);
    try {
      const directoryHandle = await pickProjectDirectory();
      const [files, indexHtml] = await Promise.all([collectSourceFiles(directoryHandle), findIndexHtml(directoryHandle)]);
      setFolderFiles(files);
      setIndexHtmlHandle(indexHtml);
      setImportMode("folder");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setFolderError(error.message);
      }
    }
  }

  async function analyzeFolderFile(file: DiscoveredFile) {
    setAnalyzedFileHandle(file.handle);
    setAnalyzedFilePath(file.path);
    const content = await (await file.handle.getFile()).text();
    await runSuggestPanels([{ name: file.path, content }]);
  }

  async function applyToProject() {
    if (!analyzedFileHandle) return;
    setApplyState({ status: "applying" });

    try {
      const selections = suggestions.filter((suggestion) => selectedSuggestionIds.has(suggestion.id));
      const sourceFile = await analyzedFileHandle.getFile();
      const sourceText = await sourceFile.text();
      const { text: patchedText, result } = applyPanelWrappers(sourceText, selections);

      const writable = await analyzedFileHandle.createWritable();
      await writable.write(patchedText);
      await writable.close();

      let nextManifest = manifest;
      for (const selection of selections) {
        nextManifest = addPanel(nextManifest, {
          id: selection.id,
          label: selection.label,
          selector: `[data-dynara-panel='${selection.id}']`
        });
      }
      onUpdateManifest(nextManifest);

      if (indexHtmlHandle) {
        const htmlFile = await indexHtmlHandle.getFile();
        const htmlText = await htmlFile.text();
        const patchedHtml = upsertScriptBlock(htmlText, nextManifest, window.location.origin);
        const htmlWritable = await indexHtmlHandle.createWritable();
        await htmlWritable.write(patchedHtml);
        await htmlWritable.close();
      }

      setApplyState({ status: "done", result, message: indexHtmlHandle ? undefined : "Couldn't find index.html — add the script tag manually." });
      setSuggestions([]);
    } catch (error) {
      setApplyState({ status: "error", message: error instanceof Error ? error.message : "Could not write to your project." });
    }
  }

  function addSelectedSuggestions() {
    let next = manifest;
    for (const suggestion of suggestions) {
      if (!selectedSuggestionIds.has(suggestion.id)) continue;
      next = addPanel(next, {
        id: suggestion.id,
        label: suggestion.label,
        selector: `[data-dynara-panel='${suggestion.id}']`
      });
    }
    onUpdateManifest(next);
    setSuggestions([]);
    setImportedFileNames([]);
    setImportStatus("idle");
  }

  function submitPanel() {
    if (!panelDraft.label.trim() || !panelDraft.selector.trim()) return;
    const id = slugify(panelDraft.label);
    onUpdateManifest(addPanel(manifest, { id, label: panelDraft.label.trim(), selector: panelDraft.selector.trim() }));
    setPanelDraft({ label: "", selector: "" });
  }

  function submitView() {
    if (!viewDraft.label.trim() || viewDraft.panels.size === 0) return;
    const id = slugify(viewDraft.label);
    onUpdateManifest(addView(manifest, { id, label: viewDraft.label.trim(), panels: [...viewDraft.panels] }));
    setViewDraft({ label: "", panels: new Set() });
  }

  function submitAction() {
    if (!actionDraft.label.trim()) return;
    const id = slugify(actionDraft.label);
    onUpdateManifest(addAction(manifest, { id, label: actionDraft.label.trim() }));
    setActionDraft({ label: "" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 overflow-hidden rounded-lg border border-border bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
        <div>
          <Badge tone="blue">Integrate Dynara</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Make {manifest.name || "your app"} customizable</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Declare the sections of your UI a user can toggle from the Dynara extension, group them into views,
            and optionally wire up real actions. This generates a <code className="rounded bg-slate-100 px-1 py-0.5">dynara.json</code> and
            a script tag you paste into your app — no Dynara account or API key required for it to work.
          </p>

          {isEmpty ? (
            <ol className="mt-5 list-decimal space-y-1.5 rounded-lg bg-slate-50 p-4 pl-9 text-sm text-slate-700">
              <li>Add a panel below for each section of your UI you want toggleable.</li>
              <li>Copy the generated JSON into <code className="rounded bg-white px-1 py-0.5">/.well-known/dynara.json</code>, or paste it into <code className="rounded bg-white px-1 py-0.5">Dynara.init()</code>.</li>
              <li>Add the script tag to your page.</li>
              <li>Reload your page with the Dynara extension&apos;s side panel open.</li>
            </ol>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="/demo/index.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-teal-600">
              See a worked example <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a href="/#developers" className="inline-flex items-center gap-1 text-sm font-bold text-teal-600">
              Read the integration guide <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="hidden place-items-center lg:grid">
          <Image
            src="/illustrations/integration-stack.png"
            alt=""
            width={640}
            height={426}
            className="h-auto w-full max-w-[640px]"
            priority
          />
        </div>
      </div>

      {/* Import from code */}
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Import from code (optional)</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload a few files and Dynara will suggest panels from the sections it finds — review and add manually. Or, in
          Chrome/Edge, import your whole project folder and Dynara can write the <code className="rounded bg-slate-100 px-1 py-0.5">data-dynara-panel</code> attributes
          and the script tag directly into your files.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".tsx,.ts,.jsx,.js,.vue,.svelte,.html"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) analyzeFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importStatus === "loading"}>
            <UploadCloud className="h-4 w-4" />
            Upload files
          </Button>
          {supportsFileSystemAccess() ? (
            <Button size="sm" variant="secondary" onClick={openProjectFolder} disabled={importStatus === "loading"}>
              <FolderOpen className="h-4 w-4" />
              Import folder &amp; auto-apply
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Folder import needs Chrome or Edge.</span>
          )}
          {importStatus === "loading" ? <span className="text-xs font-semibold text-teal-600">Analyzing…</span> : null}
        </div>

        {folderError ? <p className="mt-3 text-sm text-red-600">{folderError}</p> : null}

        {importMode === "folder" && folderFiles.length > 0 && !analyzedFilePath ? (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-600">
              Pick the dashboard/layout file that renders the sections you want toggleable:
            </p>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {folderFiles.slice(0, 60).map((file) => (
                <button
                  key={file.path}
                  onClick={() => analyzeFolderFile(file)}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-muted"
                >
                  {file.path}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {importMode === "folder" && analyzedFilePath ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Analyzing <code className="rounded bg-slate-100 px-1 py-0.5">{analyzedFilePath}</code>.{" "}
            {indexHtmlHandle ? "Found index.html — the script tag will be written there." : "No index.html found — you'll need to add the script tag manually."}
          </p>
        ) : null}

        {importStatus === "error" ? (
          <p className="mt-3 text-sm text-red-600">Could not analyze those files. Try again, or add panels manually below.</p>
        ) : null}

        {importStatus === "done" && suggestions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No new sections found — they may already be in your panel list.</p>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Found {suggestions.length} candidate section(s) — pick which to add:</p>
            {suggestions.map((suggestion) => {
              const checked = selectedSuggestionIds.has(suggestion.id);
              return (
                <label
                  key={suggestion.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedSuggestionIds((current) => {
                        const next = new Set(current);
                        checked ? next.delete(suggestion.id) : next.add(suggestion.id);
                        return next;
                      })
                    }
                  />
                  <span className="flex-1">{suggestion.label}</span>
                  {suggestion.componentName ? (
                    <span className="text-xs font-normal text-muted-foreground">{suggestion.componentName}</span>
                  ) : null}
                </label>
              );
            })}

            {importMode === "folder" ? (
              <>
                <Button size="sm" onClick={applyToProject} disabled={selectedSuggestionIds.size === 0 || applyState.status === "applying"}>
                  <Sparkles className="h-4 w-4" />
                  {applyState.status === "applying" ? "Applying…" : "Apply directly to project"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This writes <code className="rounded bg-white px-1 py-0.5">data-dynara-panel</code> attributes into{" "}
                  <code className="rounded bg-white px-1 py-0.5">{analyzedFilePath}</code> and updates the script block in your index.html. Self-closing
                  tags (<code className="rounded bg-white px-1 py-0.5">{"<Component />"}</code>) are wrapped automatically; anything else is reported below for manual edits.
                </p>
              </>
            ) : (
              <>
                <Button size="sm" onClick={addSelectedSuggestions} disabled={selectedSuggestionIds.size === 0}>
                  <Plus className="h-4 w-4" />
                  Add selected panels
                </Button>
                <p className="text-xs text-muted-foreground">
                  Each added panel uses the selector <code className="rounded bg-white px-1 py-0.5">[data-dynara-panel=&apos;id&apos;]</code> — add
                  that attribute to the matching element in your code for it to work.
                </p>
              </>
            )}
          </div>
        ) : null}

        {applyState.status === "error" ? <p className="mt-3 text-sm text-red-600">{applyState.message}</p> : null}

        {applyState.status === "done" && applyState.result ? (
          <div className="mt-4 space-y-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">Applied to your project.</p>
            {applyState.result.applied.length > 0 ? (
              <p>Wrapped: {applyState.result.applied.map((item) => item.componentName).join(", ")}</p>
            ) : null}
            {applyState.result.skipped.length > 0 ? (
              <div>
                <p className="font-semibold text-amber-800">Needs manual edit:</p>
                {applyState.result.skipped.map((item) => (
                  <p key={item.id} className="text-amber-800">
                    {item.componentName} — {item.reason}
                  </p>
                ))}
              </div>
            ) : null}
            {applyState.message ? <p className="text-amber-800">{applyState.message}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* App identity */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">App name &amp; color</h2>
          <div className="mt-4 space-y-3">
            <Input
              value={manifest.name}
              onChange={(event) => onUpdateManifest({ ...manifest, name: event.target.value, slug: slugify(event.target.value) })}
              placeholder="My App"
            />
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  aria-label={color}
                  onClick={() => onUpdateManifest({ ...manifest, color })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    manifest.color === color ? "border-slate-950 scale-110" : "border-transparent"
                  )}
                  style={{ background: color }}
                />
              ))}
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={manifest.color}
                onChange={(event) => onUpdateManifest({ ...manifest, color: event.target.value })}
              />
              <button
                type="button"
                aria-label="Custom color"
                onClick={() => colorInputRef.current?.click()}
                className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Panels</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A CSS selector for any section you want toggleable, e.g. <code className="rounded bg-slate-100 px-1 py-0.5">[data-dynara-panel=&apos;stats&apos;]</code>.
          </p>
          <div className="mt-4 space-y-2">
            {manifest.panels.map((panel) => (
              <div key={panel.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{panel.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{panel.selector}</p>
                </div>
                <button
                  aria-label={`Remove ${panel.label}`}
                  onClick={() => onUpdateManifest(removePanel(manifest, panel.id))}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input
              value={panelDraft.label}
              onChange={(event) => setPanelDraft((draft) => ({ ...draft, label: event.target.value }))}
              placeholder="Label (e.g. Statistics)"
              className="flex-1"
            />
            <Input
              value={panelDraft.selector}
              onChange={(event) => setPanelDraft((draft) => ({ ...draft, selector: event.target.value }))}
              placeholder="CSS selector"
              className="flex-1"
              onKeyDown={(event) => event.key === "Enter" && submitPanel()}
            />
            <Button size="sm" onClick={submitPanel}>
              <Plus className="h-4 w-4" />
              Add panel
            </Button>
          </div>
        </div>

        {/* Views */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Views (optional)</h2>
          <p className="mt-1 text-xs text-muted-foreground">Group panels a user can switch between with one click.</p>
          <div className="mt-4 space-y-2">
            {manifest.views.map((view) => (
              <div key={view.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{view.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{view.panels.join(", ") || "no panels"}</p>
                </div>
                <button
                  aria-label={`Remove ${view.label}`}
                  onClick={() => onUpdateManifest(removeView(manifest, view.id))}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {manifest.panels.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Add at least one panel first.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <Input
                value={viewDraft.label}
                onChange={(event) => setViewDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder="View name (e.g. Focus mode)"
              />
              <div className="flex flex-wrap gap-2">
                {manifest.panels.map((panel) => {
                  const checked = viewDraft.panels.has(panel.id);
                  return (
                    <button
                      key={panel.id}
                      onClick={() =>
                        setViewDraft((draft) => {
                          const next = new Set(draft.panels);
                          checked ? next.delete(panel.id) : next.add(panel.id);
                          return { ...draft, panels: next };
                        })
                      }
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold",
                        checked ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {panel.label}
                    </button>
                  );
                })}
              </div>
              <Button size="sm" variant="secondary" onClick={submitView}>
                <Plus className="h-4 w-4" />
                Add view
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Actions (optional)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Declared here, wired in your own code with <code className="rounded bg-slate-100 px-1 py-0.5">Dynara.action(id, fn)</code>.
          </p>
          <div className="mt-4 space-y-2">
            {manifest.actions.map((action) => (
              <div key={action.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                <p className="flex-1 truncate text-sm font-semibold text-slate-800">{action.label}</p>
                <button
                  aria-label={`Remove ${action.label}`}
                  onClick={() => onUpdateManifest(removeAction(manifest, action.id))}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={actionDraft.label}
              onChange={(event) => setActionDraft({ label: event.target.value })}
              placeholder="Action label (e.g. Generate numbers)"
              className="flex-1"
              onKeyDown={(event) => event.key === "Enter" && submitAction()}
            />
            <Button size="sm" onClick={submitAction}>
              <Plus className="h-4 w-4" />
              Add action
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <CodeBlock label="dynara.json" value={dynaraJson} />
          <p className="mt-2 text-xs text-muted-foreground">
            Only needed if you&apos;re using the static-file approach: save this as <code className="rounded bg-slate-100 px-1 py-0.5">/.well-known/dynara.json</code> at
            the root of your app&apos;s public folder. Skip this if you use the script tag&apos;s inline <code className="rounded bg-slate-100 px-1 py-0.5">Dynara.init()</code> instead.
          </p>
        </div>
        <div>
          <CodeBlock label="Script tag" value={scriptSnippet} />
          <p className="mt-2 text-xs text-muted-foreground">
            Add this to your app&apos;s root HTML — for a Vite/CRA app that&apos;s <code className="rounded bg-slate-100 px-1 py-0.5">index.html</code>, for Next.js
            it&apos;s your root <code className="rounded bg-slate-100 px-1 py-0.5">layout</code>. Paste it right before the closing <code className="rounded bg-slate-100 px-1 py-0.5">&lt;/body&gt;</code> tag.
          </p>
        </div>
      </div>
    </div>
  );
}

