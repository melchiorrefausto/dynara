"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, ExternalLink, Eye, EyeOff, FileJson, Image as ImageIcon, Plus, ShieldCheck, Sparkles, Trash2, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeBlock } from "@/components/ui/code-block";
import {
  addAction,
  addPanel,
  addView,
  generateDynaraJson,
  normalizeManifest,
  removeAction,
  removePanel,
  removeView,
  setEditKeyHash,
  sha256Hex,
  slugify
} from "@/lib/dashboard/manifest-state";
import { cn } from "@/lib/utils";
import type { ContentEditDraft } from "@/lib/supabase/content-edit-drafts";
import type { IntegrationManifest } from "@/types/manifest";

const COLOR_SWATCHES = ["#0f172a", "#2563eb", "#0d9488", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];
const PRIVATE_SCAN_COMMAND = "npx dynara scan ./your-app --out public/.well-known/dynara.json";
const SDK_INSTALL_SNIPPET = `<script src="https://dynara.io/sdk/v1.js"></script>`;
const AI_AGENT_PROMPT = `You are integrating this app with Dynara, an adaptive interface runtime.

Do this in two phases — do NOT edit any files until phase 2 is explicitly approved.

PHASE 1 — Propose (no edits yet):
Scan this app's user-facing pages and identify meaningful, independently customizable UI
sections — for example the navigation bar, hero section, sidebar, a search/toolbar region,
the main content area, a pricing table, a footer. Skip admin/internal-only screens.

For each candidate, list:
- A short kebab-case id (e.g. "hero", "hero-search", "tool-categories")
- A human label
- The file and component/element it lives in
- One line on why it's safe to hide, move, or restyle without breaking navigation, forms,
  auth, or core functionality

Present this list to me and wait for me to confirm, remove, or add entries. Don't tag
individual buttons, icons, or other tiny elements — only meaningful sections.

PHASE 2 — Tag (only after I approve the list):
For each approved section only, add a \`data-dynara-panel="<id>"\` attribute (and optionally
\`data-dynara-label="<Label>"\`) to its outermost element. Don't change any existing behavior,
styling, layout, or logic — only add these two data attributes, and only to elements that
don't already have a data-dynara-panel. Then run:
  npx dynara scan ./ --out public/.well-known/dynara.json
to generate the Dynara manifest from the attributes you just added.`;
const EDIT_PASSWORD_STORAGE_PREFIX = "dynara-edit-password";

type ImportStatus = "idle" | "loading" | "done" | "error";

export function IntegrationBuilder({
  contentEditDrafts = [],
  manifest,
  onPublishContentEditDraft,
  onRejectContentEditDraft,
  onUpdateManifest
}: {
  contentEditDrafts?: ContentEditDraft[];
  manifest: IntegrationManifest;
  onPublishContentEditDraft?: (draft: ContentEditDraft) => void;
  onRejectContentEditDraft?: (draft: ContentEditDraft) => void;
  onUpdateManifest: (manifest: IntegrationManifest) => void;
}) {
  const [panelDraft, setPanelDraft] = useState({ label: "", selector: "" });
  const [viewDraft, setViewDraft] = useState({ label: "", panels: new Set<string>() });
  const [actionDraft, setActionDraft] = useState({ label: "" });
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importedManifestName, setImportedManifestName] = useState("");
  const [copiedPrivateCommand, setCopiedPrivateCommand] = useState(false);
  const [editPasswordDraft, setEditPasswordDraft] = useState("");
  const [activeEditPassword, setActiveEditPassword] = useState<string | null>(null);
  const [copiedEditPassword, setCopiedEditPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const manifestFileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const dynaraJson = useMemo(() => generateDynaraJson(manifest), [manifest]);
  const isEmpty = manifest.panels.length === 0;
  const editPasswordStorageKey = `${EDIT_PASSWORD_STORAGE_PREFIX}:${manifest.id}`;

  useEffect(() => {
    if (!manifest.editKeyHash) {
      setActiveEditPassword(null);
      return;
    }

    try {
      const raw = window.localStorage.getItem(editPasswordStorageKey);
      if (!raw) {
        setActiveEditPassword(null);
        return;
      }
      const saved = JSON.parse(raw) as { hash?: string; password?: string };
      setActiveEditPassword(saved.hash === manifest.editKeyHash ? saved.password ?? null : null);
    } catch {
      setActiveEditPassword(null);
    }
  }, [editPasswordStorageKey, manifest.editKeyHash]);

  async function importManifestFile(file: File) {
    setImportStatus("loading");
    setImportedManifestName(file.name);

    try {
      const imported = JSON.parse(await file.text()) as Partial<IntegrationManifest>;
      onUpdateManifest(normalizeManifest({ ...imported, id: imported.id ?? manifest.id }));
      setImportStatus("done");
    } catch (error) {
      setImportStatus("error");
    }
  }

  async function copyPrivateScanCommand() {
    await navigator.clipboard.writeText(PRIVATE_SCAN_COMMAND);
    setCopiedPrivateCommand(true);
    window.setTimeout(() => setCopiedPrivateCommand(false), 1600);
  }

  async function saveEditPassword() {
    const password = editPasswordDraft.trim();
    if (!password) return;
    const hash = await sha256Hex(password);
    onUpdateManifest(setEditKeyHash(manifest, hash));
    setActiveEditPassword(password);
    try {
      window.localStorage.setItem(editPasswordStorageKey, JSON.stringify({ hash, password }));
    } catch {
      // If localStorage is unavailable, the hash is still saved in the manifest.
    }
    setEditPasswordDraft("");
  }

  function clearEditPassword() {
    onUpdateManifest(setEditKeyHash(manifest, undefined));
    setActiveEditPassword(null);
    try {
      window.localStorage.removeItem(editPasswordStorageKey);
    } catch {
      // ignore
    }
  }

  async function copyEditPassword() {
    if (!activeEditPassword) return;
    await navigator.clipboard.writeText(activeEditPassword);
    setCopiedEditPassword(true);
    window.setTimeout(() => setCopiedEditPassword(false), 1600);
  }

  function downloadDynaraJson() {
    const blob = new Blob([dynaraJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${manifest.slug || manifest.appId || "dynara"}.json`;
    link.click();
    URL.revokeObjectURL(url);
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

  const profileCount = manifest.profiles.length;
  const mutableTokenCount = manifest.designSystem.tokens.filter((token) => token.mutable).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 overflow-hidden rounded-lg border border-border bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
        <div>
          <Badge tone="blue">Integrate Dynara</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Make {manifest.name || "your app"} customizable</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Describe the surfaces, actions, design tokens, and safety constraints your product exposes to Dynara.
            The extension can apply user-specific profiles while the host software keeps control over what is safe.
          </p>

          {isEmpty ? (
            <ol className="mt-5 list-decimal space-y-1.5 rounded-lg bg-slate-50 p-4 pl-9 text-sm text-slate-700">
              <li>Run the local scanner in the customer repo.</li>
              <li>Upload the generated <code className="rounded bg-white px-1 py-0.5">dynara.json</code> here.</li>
              <li>Review or adjust panels, actions, views, and safety rules if needed.</li>
              <li>Add the SDK only if the host app needs runtime actions.</li>
            </ol>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="/demo/index.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text text-sm font-bold text-transparent"
            >
              See a worked example <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </a>
            <a
              href="/#developers"
              className="inline-flex items-center gap-1 bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text text-sm font-bold text-transparent"
            >
              Read the integration guide <ExternalLink className="h-3.5 w-3.5 text-primary" />
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

      <div className="grid gap-3 md:grid-cols-4">
        <SchemaMetric label="Surfaces" value={String(manifest.surfaces.length)} />
        <SchemaMetric label="Actions" value={String(manifest.actions.length)} />
        <SchemaMetric label="Mutable tokens" value={String(mutableTokenCount)} />
        <SchemaMetric label="Profiles" value={String(profileCount)} />
      </div>

      {/* Import from code */}
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Import from code (optional)</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate the Dynara manifest locally from your code, then upload only that JSON. The source folder stays on
          the company machine.
        </p>

        <div className="mt-4">
          <p className="font-semibold text-slate-800">1. AI-assisted annotation (recommended)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste this into Claude Code, Codex, Cursor, or any coding agent inside your repo. It first proposes
            which sections it found and waits for your approval, then only tags what you confirm — no
            manual selector-hunting, no surprise edits.
          </p>
          <CodeBlock className="mt-3" label="Prompt for your coding agent" value={AI_AGENT_PROMPT} />
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">2. Generate the manifest</p>
              <p className="mt-1">
                Run this inside the customer repo, after tagging (step 1) or on its own. Only the generated
                customization contract is imported into Dynara.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={copyPrivateScanCommand}>
              {copiedPrivateCommand ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedPrivateCommand ? "Copied" : "Copy"}
            </Button>
          </div>
          <code className="mt-3 block overflow-x-auto rounded bg-white px-2 py-1.5 text-slate-700">
            {PRIVATE_SCAN_COMMAND}
          </code>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={manifestFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importManifestFile(file);
              event.currentTarget.value = "";
            }}
          />
          <Button size="sm" variant="secondary" onClick={() => manifestFileInputRef.current?.click()} disabled={importStatus === "loading"}>
            <FileJson className="h-4 w-4" />
            3. Upload generated dynara.json
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadDynaraJson}>
            <Download className="h-4 w-4" />
            Download current dynara.json
          </Button>
          {importStatus === "loading" ? <span className="text-xs font-semibold text-primary">Analyzing…</span> : null}
        </div>

        {importStatus === "error" ? (
          <p className="mt-3 text-sm text-red-600">Could not import that file. Try a valid dynara.json or add panels manually below.</p>
        ) : null}

        {importStatus === "done" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Imported <code className="rounded bg-slate-100 px-1 py-0.5">{importedManifestName || "dynara.json"}</code>.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* App identity */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">App identity</h2>
          <div className="mt-4 space-y-3">
            <Input
              value={manifest.name}
              onChange={(event) =>
                onUpdateManifest({
                  ...manifest,
                  name: event.target.value,
                  slug: slugify(event.target.value),
                  appId: manifest.appId || slugify(event.target.value)
                })
              }
              placeholder="My App"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={manifest.appId}
                onChange={(event) => onUpdateManifest({ ...manifest, appId: slugify(event.target.value) })}
                placeholder="app-id"
              />
              <Input
                value={manifest.version}
                onChange={(event) => onUpdateManifest({ ...manifest, version: event.target.value || "1.0.0" })}
                placeholder="1.0.0"
              />
            </div>
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

        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Runtime contract</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Dynara treats panels as controllable surfaces. Required surfaces and permission rules protect the host app
            from unsafe generated layouts.
          </p>
          <div className="mt-4 space-y-2">
            {manifest.constraints.map((constraint) => (
              <div key={constraint.id} className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-sm font-semibold text-slate-800">{constraint.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{constraint.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold uppercase tracking-normal text-slate-800">Content blocks</h2>
            <Badge tone="purple">Dynara Edit</Badge>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{manifest.contentBlocks.length} synced</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Text and images edited from the extension&apos;s <strong>Edit</strong> tab — a lighter, no-manifest-required
          companion to panel customization. Editors submit changes as drafts, and owners publish approved blocks from
          this dashboard.
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Dedicated edit link</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Set a password to gate Edit mode. Anyone who opens your site with{" "}
            <code className="rounded bg-white px-1 py-0.5">?dynaraEditKey=&lt;password&gt;</code> in the URL unlocks
            it automatically — no login, no extra install steps beyond the extension.
          </p>

          {manifest.editKeyHash ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Password set
              </span>
              <button
                onClick={clearEditPassword}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove password
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold text-slate-500">No password set — Edit mode is open to anyone with the extension.</p>
          )}

          <div className="mt-3 flex gap-2">
            <Input
              type="password"
              value={editPasswordDraft}
              onChange={(event) => setEditPasswordDraft(event.target.value)}
              placeholder={manifest.editKeyHash ? "New password" : "Set an edit password"}
              className="flex-1"
              onKeyDown={(event) => event.key === "Enter" && saveEditPassword()}
            />
            <Button size="sm" onClick={saveEditPassword} disabled={!editPasswordDraft.trim()}>
              Save
            </Button>
          </div>

          {activeEditPassword ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-white p-2.5">
              <input
                readOnly
                type={showEditPassword ? "text" : "password"}
                value={activeEditPassword}
                aria-label="Current edit password"
                className="min-w-0 flex-1 truncate bg-transparent text-xs font-semibold text-slate-700 outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                type="button"
                aria-label={showEditPassword ? "Hide password" : "Show password"}
                onClick={() => setShowEditPassword((visible) => !visible)}
              >
                {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="secondary" onClick={copyEditPassword}>
                {copiedEditPassword ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedEditPassword ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
        </div>

        {contentEditDrafts.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Pending review ({contentEditDrafts.length})
            </p>
            {contentEditDrafts.map((draft) => (
              <div key={draft.id} className="rounded-lg border border-violet-100 bg-violet-50/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{draft.pagePath}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {draft.blocks.length} edit{draft.blocks.length === 1 ? "" : "s"} submitted{" "}
                      {new Date(draft.submittedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onRejectContentEditDraft?.(draft)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => onPublishContentEditDraft?.(draft)}>
                      Publish
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {draft.blocks.slice(0, 4).map((block) => (
                    <div key={block.id} className="flex items-start gap-2 rounded bg-white p-2">
                      {block.type === "image" ? (
                        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <Type className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                        {block.value || block.key}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {manifest.contentBlocks.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
            No content blocks synced yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {manifest.contentBlocks.map((block) => (
              <div key={block.id} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
                {block.type === "image" ? (
                  <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <Type className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                )}
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{block.value || block.key}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <CodeBlock label="Imported contract preview" value={dynaraJson} />
          <p className="mt-2 text-xs text-muted-foreground">
            Review-only in the private flow. The local scanner already creates this file in the host app; use this
            preview to confirm Dynara imported the same contract.
          </p>
        </div>
        <div>
          <CodeBlock label="SDK install, only if needed" value={SDK_INSTALL_SNIPPET} />
          <p className="mt-2 text-xs text-muted-foreground">
            The browser extension can read <code className="rounded bg-slate-100 px-1 py-0.5">/.well-known/dynara.json</code> directly.
            Add the SDK when the host app exposes actions with <code className="rounded bg-slate-100 px-1 py-0.5">Dynara.action(id, fn)</code>,
            or when the scanner has not already added it.
          </p>
        </div>
      </div>
    </div>
  );
}

function SchemaMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
