import { useEffect, useState, useCallback, useRef } from "react";
import { DEFAULT_MANIFEST, type DynaraManifest, type InterfacePlan, type ManifestPanel, type ManifestView, type UserInterfaceProfile } from "../shared/manifest";
import { getBackendUrl, setBackendUrl } from "../shared/config";
import { auditManifestContrast, auditProfileContrast, contrastSummary, failingContrast, type ContrastResult } from "../shared/contrast";

type AskState = "idle" | "loading" | "done";
type PersistedState = {
  autoApply: boolean;
  savedAt?: string;
};

type SelectedSurface = {
  id: string;
  label: string;
  selector: string;
};

type SurfaceStyle = {
  background?: string;
  color?: string;
  spacing?: "compact" | "normal" | "spacious";
  radius?: "none" | "soft" | "round";
  fontScale?: "small" | "normal" | "large";
};

const THEME_SWATCHES: Record<string, string[]> = {
  "ocean-theme": ["#0e7490", "#14b8a6", "#ecfeff"],
  "mono-compact": ["#0f172a", "#64748b", "#f8fafc"],
  "sunset-spacious": ["#e11d48", "#f97316", "#fff7ed"],
  "theme-ocean": ["#0e7490", "#14b8a6", "#ecfeff"],
  "theme-mono": ["#0f172a", "#64748b", "#f8fafc"],
  "theme-sunset": ["#e11d48", "#f97316", "#fff7ed"]
};

const MODE_PROFILE_IDS = new Set(["content-focus", "reading-mode", "hero-showcase", "hero-compact", "full-interface"]);
const HERO_ACTION_IDS = new Set(["hero-showcase", "hero-compact", "hero-clean", "hero-reset"]);

const BACKGROUND_PRESETS = [
  { label: "Default", value: "" },
  { label: "White", value: "#ffffff" },
  { label: "Ocean", value: "#ecfeff" },
  { label: "Warm", value: "#fff7ed" },
  { label: "Ink", value: "#0f172a" }
];

const TEXT_PRESETS = [
  { label: "Default", value: "" },
  { label: "Ink", value: "#0f172a" },
  { label: "Muted", value: "#475569" },
  { label: "White", value: "#ffffff" }
];

function actionLabel(label: string) {
  return label.replace(/^Toggle /, "").replace(/^Apply /, "").replace(/ changes$/, "");
}

function profileLabel(label: string) {
  return label.replace(/ theme$/i, "");
}

type AskLayoutBlock = {
  title?: string;
  content?: string;
  value?: string;
  items?: unknown[];
  actions?: unknown[];
};

function formatAskItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (!item || typeof item !== "object") return "";

  const record = item as Record<string, unknown>;
  const title = record.title ?? record.label ?? record.name ?? record.id;
  const subtitle = record.subtitle ?? record.description ?? record.value ?? record.status ?? record.severity;

  return [title, subtitle].filter(Boolean).map(String).join(" — ");
}

function formatAskBlock(block: AskLayoutBlock): string {
  const lines = [block.title, block.content, block.value].filter(Boolean).map(String);
  const items = block.items?.map(formatAskItem).filter(Boolean) ?? [];
  const actions = block.actions?.map(formatAskItem).filter(Boolean) ?? [];

  return [...lines, ...items.map((item) => `• ${item}`), ...actions.map((action) => `• ${action}`)].join("\n");
}

function formatInterfacePlan(plan: InterfacePlan, manifest: DynaraManifest): string {
  const profile = plan.profileId ? manifest.profiles.find((item) => item.id === plan.profileId) : undefined;
  const contrastResults = auditManifestContrast(manifest, {
    ...(profile?.tokenOverrides ?? {}),
    ...(plan.tokenOverrides ?? {})
  });
  const issues = failingContrast(contrastResults);

  return [
    plan.title,
    plan.summary,
    plan.profileId ? `Profile: ${plan.profileId}` : null,
    plan.viewId ? `View: ${plan.viewId}` : null,
    plan.actionIds?.length ? `Actions: ${plan.actionIds.join(", ")}` : null,
    plan.tokenOverrides && Object.keys(plan.tokenOverrides).length > 0
      ? `Tokens: ${Object.keys(plan.tokenOverrides).join(", ")}`
      : null,
    contrastResults.length ? `Contrast: ${contrastSummary(contrastResults)}` : null,
    issues.length ? `Needs review: ${issues.map((issue) => `${issue.label} ${issue.ratio}:1`).join(", ")}` : null,
    plan.save ? "Will save and auto-apply this configuration." : null
  ].filter(Boolean).join("\n");
}

function contrastBadge(results: ContrastResult[]) {
  const issues = failingContrast(results);
  if (results.length === 0) return { text: "No pairs", bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  if (issues.length === 0) return { text: "AA", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  return { text: `${issues.length} issue${issues.length === 1 ? "" : "s"}`, bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" };
}

export function App() {
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [manifest, setManifest] = useState<DynaraManifest>(DEFAULT_MANIFEST);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [askState, setAskState] = useState<AskState>("idle");
  const [answer, setAnswer] = useState("");
  const [pendingPlan, setPendingPlan] = useState<InterfacePlan | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [persistedState, setPersistedState] = useState<PersistedState | null>(null);
  const [backend, setBackend] = useState("");
  const [editingBackend, setEditingBackend] = useState(false);
  const [inspectMode, setInspectModeState] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<SelectedSurface | null>(null);
  const [surfaceStyles, setSurfaceStyles] = useState<Record<string, SurfaceStyle>>({});

  useEffect(() => {
    getBackendUrl().then(setBackend);
  }, []);

	  const latestTabIdRef = useRef<number | null>(null);

	  const syncState = useCallback((id: number) => {
	    latestTabIdRef.current = id;
	    const isStale = () => latestTabIdRef.current !== id;

	    chrome.runtime.sendMessage({ type: "GET_TAB_STATE", tabId: id }, (res) => {
	      if (isStale()) return;
	      if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
	    });
    chrome.runtime.sendMessage({ type: "GET_MANIFEST_IN_TAB", tabId: id }, (res) => {
      if (isStale()) return;
      if (!chrome.runtime.lastError && res?.manifest) setManifest(res.manifest);
      else setManifest(DEFAULT_MANIFEST);
      setActiveView(null);
    });
	    chrome.runtime.sendMessage({ type: "GET_PERSISTENCE_IN_TAB", tabId: id }, (res) => {
	      if (isStale()) return;
	      if (!chrome.runtime.lastError) setPersistedState(res?.state ?? null);
	    });
	    chrome.runtime.sendMessage({ type: "GET_WYSIWYG_STATE_IN_TAB", tabId: id }, (res) => {
	      if (isStale()) return;
	      if (!chrome.runtime.lastError) {
	        setInspectModeState(Boolean(res?.inspectMode));
	        setSelectedSurface(res?.selectedSurface ?? null);
	        setSurfaceStyles(res?.surfaceStyles ?? {});
	      }
	    });
	  }, []);

  useEffect(() => {
    const load = (tid?: number, tabUrl?: string) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) return;
        const id = tid ?? tab.id;
        const u = tabUrl ?? tab.url ?? "";
        setTabId(id);
        setUrl(u);
        syncState(id);
      });
    };

    load();

    const onActivated = () => load();
    const onUpdated = (_: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (info.status === "complete" && tab.active) load(tab.id, tab.url);
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
	  }, [syncState]);

	  useEffect(() => {
	    const onMessage = (msg: unknown) => {
	      const message = msg as { type?: string; selectedSurface?: SelectedSurface; surfaceStyles?: Record<string, SurfaceStyle> };
	      if (message.type !== "WYSIWYG_SELECTED") return;
	      setInspectModeState(false);
	      setSelectedSurface(message.selectedSurface ?? null);
	      setSurfaceStyles(message.surfaceStyles ?? {});
	    };

	    chrome.runtime.onMessage.addListener(onMessage);
	    return () => chrome.runtime.onMessage.removeListener(onMessage);
	  }, []);

  const togglePanel = (panel: ManifestPanel) => {
    if (!tabId) return;
    setActiveView(null);
    chrome.runtime.sendMessage(
      { type: "TOGGLE_PANEL_IN_TAB", tabId, panelId: panel.id, selector: panel.selector },
      (res) => {
        if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
        else setHidden((prev) => {
          const next = new Set(prev);
          next.has(panel.id) ? next.delete(panel.id) : next.add(panel.id);
          return next;
        });
      }
    );
  };

  const applyView = (view: ManifestView) => {
    if (!tabId) return;
    chrome.runtime.sendMessage(
      { type: "APPLY_VIEW_IN_TAB", tabId, panels: manifest.panels, visiblePanelIds: view.panels, viewId: view.id },
      (res) => {
        if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
        setActiveView(view.id);
      }
    );
  };

  const applyProfile = (profile: UserInterfaceProfile) => {
    if (!tabId) return;
    const panels = manifest.panels.length > 0
      ? manifest.panels
      : manifest.surfaces
          .filter((surface) => surface.selector)
          .map((surface) => ({ id: surface.id, label: surface.label, selector: surface.selector! }));

    chrome.runtime.sendMessage(
      { type: "APPLY_PROFILE_IN_TAB", tabId, panels, visiblePanelIds: profile.visibleSurfaces, profile },
      (res) => {
        if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
        setActiveView(profile.id);
      }
    );
  };

  const triggerAction = (actionId: string, label: string) => {
    if (!tabId) return;
    console.info("[Dynara sidepanel] trigger action", { tabId, actionId, label });
    chrome.runtime.sendMessage({ type: "TRIGGER_ACTION_IN_TAB", tabId, actionId }, (res) => {
      console.info("[Dynara sidepanel] trigger action response", { actionId, label, res, error: chrome.runtime.lastError?.message });
      const debug = res?.debug;
      setActionFeedback(
        debug
          ? `${label}: handled=${String(debug.handled)} classes=${debug.htmlClassName || "(none)"} main=${debug.mainWidth ?? "?"}px`
          : `Triggered "${label}"`
      );
      setTimeout(() => setActionFeedback(null), 2000);
    });
  };

  const ask = async () => {
    if (!prompt.trim()) return;
    setAskState("loading");
    setPendingPlan(null);
    try {
      const res = await fetch(`${backend}/api/interpret-interface-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          manifest
        })
      });
      const data = await res.json() as { plan?: InterfacePlan; schema?: { description?: string; layout?: AskLayoutBlock[] } };
      if (data.plan) {
        setPendingPlan(data.plan);
        setAnswer(formatInterfacePlan(data.plan, manifest));
      } else {
        const blocks = data.schema?.layout ?? [];
        const text = blocks.map(formatAskBlock).filter(Boolean).join("\n\n");
        setAnswer(text || data.schema?.description || "No answer.");
      }
      setAskState("done");
    } catch {
      setAnswer(`Could not reach Dynara backend (${backend}).`);
      setAskState("done");
    }
  };

	  const applyPendingPlan = () => {
	    if (!tabId || !pendingPlan) return;
	    chrome.runtime.sendMessage({ type: "APPLY_INTERFACE_PLAN_IN_TAB", tabId, plan: pendingPlan }, (res) => {
	      if (!chrome.runtime.lastError && res?.ok) {
	        if (res.state) setPersistedState(res.state);
	        const contrastIssues = res.applied?.contrastIssues?.length ?? 0;
	        setActionFeedback(contrastIssues > 0 ? `Applied with ${contrastIssues} contrast issue${contrastIssues === 1 ? "" : "s"}` : `Applied "${pendingPlan.title}"`);
	      } else {
	        setActionFeedback("Could not apply suggestion");
      }
      setTimeout(() => setActionFeedback(null), 2000);
      syncState(tabId);
    });
  };

  const saveBackend = (value: string) => {
    const next = value.trim() || backend;
    setBackend(next);
    setEditingBackend(false);
    void setBackendUrl(next);
  };

  const saveCurrentState = () => {
    if (!tabId) return;
    chrome.runtime.sendMessage({ type: "SAVE_CURRENT_STATE_IN_TAB", tabId }, (res) => {
      if (!chrome.runtime.lastError && res?.state) {
        setPersistedState(res.state);
        setSaveFeedback("Saved for this site");
      } else {
        setSaveFeedback("Could not save");
      }
      setTimeout(() => setSaveFeedback(null), 1800);
    });
  };

  const toggleAutoApply = () => {
    if (!tabId) return;
    const autoApply = !persistedState?.autoApply;
    chrome.runtime.sendMessage({ type: "SET_AUTO_APPLY_IN_TAB", tabId, autoApply }, (res) => {
      if (!chrome.runtime.lastError && res?.state) {
        setPersistedState(res.state);
        setSaveFeedback(autoApply ? "Auto-apply enabled" : "Auto-apply disabled");
      }
      setTimeout(() => setSaveFeedback(null), 1800);
    });
  };

	  const clearSavedState = () => {
	    if (!tabId) return;
	    chrome.runtime.sendMessage({ type: "CLEAR_SAVED_STATE_IN_TAB", tabId }, () => {
	      setPersistedState(null);
	      setSaveFeedback("Saved config cleared");
	      setTimeout(() => setSaveFeedback(null), 1800);
	    });
	  };

	  const toggleInspectMode = () => {
	    if (!tabId) return;
	    const enabled = !inspectMode;
	    chrome.runtime.sendMessage({ type: "SET_INSPECT_MODE_IN_TAB", tabId, enabled }, (res) => {
	      if (!chrome.runtime.lastError) {
	        setInspectModeState(Boolean(res?.inspectMode));
	        setSelectedSurface(res?.selectedSurface ?? null);
	        setSurfaceStyles(res?.surfaceStyles ?? {});
	      }
	    });
	  };

	  const selectSurfaceFromPanel = (panelId: string) => {
	    const panel = manifest.panels.find((item) => item.id === panelId);
	    if (!panel) {
	      setSelectedSurface(null);
	      return;
	    }

	    setSelectedSurface({
	      id: panel.id,
	      label: panel.label,
	      selector: panel.selector
	    });
	  };

	  const applySelectedSurfaceStyle = (patch: SurfaceStyle) => {
	    if (!tabId || !selectedSurface) return;
	    const next = { ...(surfaceStyles[selectedSurface.id] ?? {}), ...patch };
	    chrome.runtime.sendMessage({ type: "APPLY_SURFACE_STYLE_IN_TAB", tabId, panelId: selectedSurface.id, style: next }, (res) => {
	      if (!chrome.runtime.lastError && res?.ok) {
	        setSurfaceStyles(res.surfaceStyles ?? {});
	        setActionFeedback(`Updated ${selectedSurface.label}`);
	        setTimeout(() => setActionFeedback(null), 1600);
	      }
	    });
	  };

	  const resetSelectedSurfaceStyle = () => {
	    if (!tabId || !selectedSurface) return;
	    chrome.runtime.sendMessage({ type: "RESET_SURFACE_STYLE_IN_TAB", tabId, panelId: selectedSurface.id }, (res) => {
	      if (!chrome.runtime.lastError && res?.ok) {
	        setSurfaceStyles(res.surfaceStyles ?? {});
	        setActionFeedback(`Reset ${selectedSurface.label}`);
	        setTimeout(() => setActionFeedback(null), 1600);
	      }
	    });
	  };

	  const modeProfiles = manifest.profiles.filter((profile) => MODE_PROFILE_IDS.has(profile.id));
  const themeProfiles = manifest.profiles.filter((profile) => !MODE_PROFILE_IDS.has(profile.id));
  const themeActions = manifest.actions.filter((action) => action.id.startsWith("theme-"));
  const heroActions = manifest.actions.filter((action) => HERO_ACTION_IDS.has(action.id));
  const utilityActions = manifest.actions.filter((action) => !action.id.startsWith("theme-") && !HERO_ACTION_IDS.has(action.id));
	  const manifestContrast = auditManifestContrast(manifest);
	  const manifestContrastIssues = failingContrast(manifestContrast);
	  const selectedStyle = selectedSurface ? surfaceStyles[selectedSurface.id] ?? {} : {};

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif", fontSize: 13, color: "#0f172a", height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>D</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Dynara</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>Interface runtime</div>
        </div>
        {manifest.source !== "none" && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: manifest.color + "22", color: manifest.color }}>{manifest.name}</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 16px" }}>
        {manifest.source !== "none" && (
          <p style={{ fontSize: 10, color: "#94a3b8", padding: "10px 16px 0", margin: 0 }}>
            Detected via {manifest.source === "sdk" ? "Dynara SDK" : manifest.source === "well-known" ? "dynara.json" : "data-dynara-panel attributes"}
          </p>
        )}

	        {manifest.source !== "none" && (
	          <section style={{ padding: "10px 16px 0" }}>
	            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <button
                onClick={saveCurrentState}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                Save current
              </button>
              <button
                onClick={toggleAutoApply}
                style={{ background: persistedState?.autoApply ? "#ecfdf5" : "#f8fafc", color: persistedState?.autoApply ? "#047857" : "#334155", border: persistedState?.autoApply ? "1px solid #a7f3d0" : "1px solid #e8edf5", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                {persistedState?.autoApply ? "Auto on" : "Auto off"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 20, marginTop: 5 }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {persistedState?.savedAt ? `Saved ${new Date(persistedState.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No saved config"}
              </span>
              {persistedState ? (
                <button onClick={clearSavedState} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: 10, fontWeight: 800 }}>
                  Reset saved
                </button>
              ) : null}
            </div>
	            {saveFeedback ? <p style={{ margin: "2px 0 0", fontSize: 10, color: "#16a34a", fontWeight: 700 }}>{saveFeedback}</p> : null}
	          </section>
	        )}

	        {manifest.source !== "none" && manifestContrast.length > 0 && (
	          <section style={{ padding: "10px 16px 0" }}>
	            <p style={sectionTitle}>Accessibility</p>
	            <div style={{ border: manifestContrastIssues.length ? "1px solid #fed7aa" : "1px solid #a7f3d0", background: manifestContrastIssues.length ? "#fff7ed" : "#ecfdf5", borderRadius: 8, padding: "9px 10px" }}>
	              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
	                <span style={{ fontSize: 12, fontWeight: 800, color: manifestContrastIssues.length ? "#9a3412" : "#047857" }}>WCAG contrast</span>
	                <span style={{ fontSize: 10, fontWeight: 900, color: manifestContrastIssues.length ? "#9a3412" : "#047857" }}>{contrastSummary(manifestContrast)}</span>
	              </div>
	              {manifestContrastIssues.length > 0 ? (
	                <div style={{ marginTop: 6, display: "grid", gap: 3 }}>
	                  {manifestContrastIssues.slice(0, 3).map((issue) => (
	                    <span key={issue.id} style={{ fontSize: 10, color: "#9a3412", lineHeight: 1.35 }}>
	                      {issue.label}: {issue.ratio}:1 needs 4.5:1
	                    </span>
	                  ))}
	                </div>
	              ) : (
	                <p style={{ margin: "5px 0 0", fontSize: 10, color: "#047857", lineHeight: 1.35 }}>
	                  Declared foreground/background pairs pass WCAG AA.
	                </p>
	              )}
	            </div>
	          </section>
	        )}

	        {manifest.source !== "none" && (
	          <section style={{ padding: "10px 16px 0" }}>
	            <p style={sectionTitle}>Visual editor</p>
	            <div style={{ border: "1px solid #e8edf5", background: "#f8fafc", borderRadius: 8, padding: 10 }}>
	              <button
	                onClick={toggleInspectMode}
	                style={{ width: "100%", background: inspectMode ? "#111827" : "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
	              >
	                {inspectMode ? "Click a surface on the page" : "Select surface"}
	              </button>

	              {manifest.panels.length > 0 && (
	                <div style={{ marginTop: 8 }}>
	                  <p style={{ ...miniLabel, marginTop: 0 }}>Surface picker</p>
	                  <select
	                    value={selectedSurface?.id ?? ""}
	                    onChange={(event) => selectSurfaceFromPanel(event.target.value)}
	                    style={{ width: "100%", border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", borderRadius: 8, padding: "8px 9px", fontSize: 12, fontWeight: 800, outline: "none" }}
	                  >
	                    <option value="">Choose a surface</option>
	                    {manifest.panels.map((panel) => (
	                      <option key={panel.id} value={panel.id}>
	                        {panel.label}
	                      </option>
	                    ))}
	                  </select>
	                </div>
	              )}

	              {selectedSurface ? (
	                <div style={{ marginTop: 10 }}>
	                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
	                    <div>
	                      <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>{selectedSurface.label}</div>
	                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{selectedSurface.selector}</div>
	                    </div>
	                    <button onClick={resetSelectedSurfaceStyle} style={{ border: "1px solid #fed7aa", background: "#fff7ed", color: "#9a3412", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
	                      Reset
	                    </button>
	                  </div>

	                  <p style={miniLabel}>Background</p>
	                  <div style={segmentedGrid}>
	                    {BACKGROUND_PRESETS.map((preset) => (
	                      <button
	                        key={preset.label}
	                        onClick={() => applySelectedSurfaceStyle({ background: preset.value || undefined })}
	                        style={{ ...optionButton, borderColor: (selectedStyle.background ?? "") === preset.value ? "#7c3aed" : "#e8edf5", background: preset.value || "#fff", color: preset.value === "#0f172a" ? "#fff" : "#334155" }}
	                      >
	                        {preset.label}
	                      </button>
	                    ))}
	                  </div>

	                  <p style={miniLabel}>Text</p>
	                  <div style={segmentedGrid}>
	                    {TEXT_PRESETS.map((preset) => (
	                      <button
	                        key={preset.label}
	                        onClick={() => applySelectedSurfaceStyle({ color: preset.value || undefined })}
	                        style={{ ...optionButton, borderColor: (selectedStyle.color ?? "") === preset.value ? "#7c3aed" : "#e8edf5", color: preset.value || "#334155" }}
	                      >
	                        {preset.label}
	                      </button>
	                    ))}
	                  </div>

	                  <p style={miniLabel}>Spacing</p>
	                  <div style={segmentedGrid}>
	                    {(["compact", "normal", "spacious"] as const).map((value) => (
	                      <button key={value} onClick={() => applySelectedSurfaceStyle({ spacing: value })} style={{ ...optionButton, borderColor: (selectedStyle.spacing ?? "normal") === value ? "#7c3aed" : "#e8edf5" }}>
	                        {value}
	                      </button>
	                    ))}
	                  </div>

	                  <p style={miniLabel}>Radius</p>
	                  <div style={segmentedGrid}>
	                    {(["none", "soft", "round"] as const).map((value) => (
	                      <button key={value} onClick={() => applySelectedSurfaceStyle({ radius: value })} style={{ ...optionButton, borderColor: selectedStyle.radius === value ? "#7c3aed" : "#e8edf5" }}>
	                        {value}
	                      </button>
	                    ))}
	                  </div>

	                  <p style={miniLabel}>Type</p>
	                  <div style={segmentedGrid}>
	                    {(["small", "normal", "large"] as const).map((value) => (
	                      <button key={value} onClick={() => applySelectedSurfaceStyle({ fontScale: value })} style={{ ...optionButton, borderColor: (selectedStyle.fontScale ?? "normal") === value ? "#7c3aed" : "#e8edf5" }}>
	                        {value}
	                      </button>
	                    ))}
	                  </div>
	                </div>
	              ) : (
	                <p style={{ margin: "8px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
	                  Select a declared Dynara surface on the page to edit it visually.
	                </p>
	              )}
	            </div>
	          </section>
	        )}

		        {/* Profiles */}
        {manifest.profiles.length > 0 && (
          <section style={{ padding: "10px 16px 0" }}>
            <p style={sectionTitle}>Modes</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
	                  {modeProfiles.map((profile) => {
	                const active = activeView === profile.id;
	                const badge = contrastBadge(auditProfileContrast(manifest, profile));
	                return (
	                  <button
                    key={profile.id}
                    onClick={() => applyProfile(profile)}
                    title={profile.description}
                    style={{
                      minHeight: 56,
                      background: active ? "#7c3aed" : "#f8fafc",
                      color: active ? "#fff" : "#334155",
                      border: active ? "1px solid #7c3aed" : "1px solid #e8edf5",
                      borderRadius: 8,
                      padding: "8px 7px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      textAlign: "left",
                      lineHeight: 1.15
                    }}
	                  >
	                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
	                      <span>{profileLabel(profile.label)}</span>
	                      <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: 999, padding: "1px 5px", fontSize: 8, fontWeight: 900 }}>
	                        {badge.text}
	                      </span>
	                    </span>
	                    <span style={{ display: "block", marginTop: 4, fontSize: 9, color: active ? "#ede9fe" : "#94a3b8", fontWeight: 700 }}>
	                      {profile.density}
                    </span>
                  </button>
                );
              })}
            </div>

            {themeProfiles.length > 0 && (
              <>
                <p style={{ ...sectionTitle, marginTop: 12 }}>Themes</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
	                  {themeProfiles.map((profile) => {
	                    const active = activeView === profile.id;
	                    const swatches = THEME_SWATCHES[profile.id] ?? ["#7c3aed", "#a855f7", "#f5f3ff"];
	                    const badge = contrastBadge(auditProfileContrast(manifest, profile));
	                    return (
                      <button
                        key={profile.id}
                        onClick={() => applyProfile(profile)}
                        title={profile.description}
                        style={{
                          minHeight: 62,
                          background: active ? "#111827" : "#fff",
                          color: active ? "#fff" : "#334155",
                          border: active ? "1px solid #111827" : "1px solid #e8edf5",
                          borderRadius: 8,
                          padding: 8,
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <span style={{ display: "flex", gap: 3, marginBottom: 7 }}>
                          {swatches.map((color) => (
                            <span key={color} style={{ width: 16, height: 16, borderRadius: 999, background: color, border: "1px solid rgba(15,23,42,0.1)" }} />
                          ))}
                        </span>
	                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
	                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, lineHeight: 1.1 }}>{profileLabel(profile.label)}</span>
	                          <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: 999, padding: "1px 5px", fontSize: 8, fontWeight: 900 }}>
	                            {badge.text}
	                          </span>
	                        </span>
	                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Views */}
        {manifest.views.length > 0 && (
          <section style={{ padding: "10px 16px 0" }}>
            <p style={sectionTitle}>Views</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {manifest.views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => applyView(view)}
                  style={{
                    background: activeView === view.id ? "#7c3aed" : "#f1f5f9",
                    color: activeView === view.id ? "#fff" : "#334155",
                    border: "none", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 800, cursor: "pointer"
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Panel controls */}
        <section style={{ padding: "14px 16px 0" }}>
          <p style={sectionTitle}>Surfaces</p>
          {manifest.panels.length === 0 ? (
            <p style={{ fontSize: 11, color: "#94a3b8" }}>No controls for this app yet. Add a Dynara manifest to enable them.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
              {manifest.panels.map((panel) => {
                const isHidden = hidden.has(panel.id);
                return (
                  <div key={panel.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#f8fafc", border: "1px solid #eef2f7" }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#334155" }}>{panel.label}</span>
                    <button
                      onClick={() => togglePanel(panel)}
                      style={{ background: isHidden ? "#e2e8f0" : "#7c3aed", color: isHidden ? "#475569" : "#fff", border: "none", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                    >
                      {isHidden ? "Show" : "Hide"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Actions */}
        {manifest.actions.length > 0 && (
          <section style={{ padding: "14px 16px 0" }}>
            <p style={sectionTitle}>Actions</p>
            {actionFeedback && (
              <p style={{ fontSize: 10, color: "#16a34a", margin: "0 0 8px", lineHeight: 1.35 }}>{actionFeedback}</p>
            )}
	            {themeActions.length > 0 && (
	              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>
                {themeActions.map((action) => {
                  const swatches = THEME_SWATCHES[action.id] ?? ["#7c3aed", "#a855f7", "#f5f3ff"];
                  return (
                    <button
                      key={action.id}
                      onClick={() => triggerAction(action.id, action.label)}
                      title={action.description}
                      style={{ minHeight: 58, background: "#fff", color: "#334155", border: "1px solid #e8edf5", borderRadius: 8, padding: 7, fontSize: 10, fontWeight: 800, cursor: "pointer", textAlign: "left", lineHeight: 1.1 }}
                    >
                      <span style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                        {swatches.map((color) => (
                          <span key={color} style={{ width: 13, height: 13, borderRadius: 999, background: color, border: "1px solid rgba(15,23,42,0.1)" }} />
                        ))}
                      </span>
                      {actionLabel(action.label)}
                    </button>
                  );
                })}
	              </div>
	            )}
	            {heroActions.length > 0 && (
	              <>
	                <p style={{ ...sectionTitle, marginTop: 8, marginBottom: 6 }}>Hero</p>
	                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>
	                  {heroActions.map((action) => (
	                    <button
	                      key={action.id}
	                      onClick={() => triggerAction(action.id, action.label)}
	                      title={action.description}
	                      style={{ minHeight: 44, background: action.id.includes("reset") ? "#fff7ed" : "#f8fafc", color: action.id.includes("reset") ? "#9a3412" : "#334155", border: action.id.includes("reset") ? "1px solid #fed7aa" : "1px solid #e8edf5", borderRadius: 8, padding: "8px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "left", lineHeight: 1.15 }}
	                    >
	                      {actionLabel(action.label)}
	                    </button>
	                  ))}
	                </div>
	              </>
	            )}
	            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
              {utilityActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => triggerAction(action.id, action.label)}
                  title={action.description}
                  style={{ minHeight: 42, background: action.id.includes("reset") ? "#fff7ed" : "#f1f5f9", color: action.id.includes("reset") ? "#9a3412" : "#334155", border: action.id.includes("reset") ? "1px solid #fed7aa" : "1px solid transparent", borderRadius: 8, padding: "8px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "left", lineHeight: 1.15 }}
                >
                  {actionLabel(action.label)}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />

        {/* Ask Dynara */}
        <section style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ ...sectionTitle, marginBottom: 0 }}>Ask Dynara</p>
            {editingBackend ? (
              <input
                autoFocus
                defaultValue={backend}
                onBlur={(e) => saveBackend(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveBackend((e.target as HTMLInputElement).value); }}
                style={{ fontSize: 10, color: "#334155", border: "1px solid #e2e8f0", borderRadius: 5, padding: "2px 6px", width: 140, outline: "none" }}
              />
            ) : (
              <button
                onClick={() => setEditingBackend(true)}
                title="Change the Dynara backend URL"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#94a3b8", padding: 0 }}
              >
                {backend}
              </button>
            )}
          </div>
          {askState === "done" && answer && (
            <div style={{ background: "#f5f3ff", borderRadius: 8, padding: "10px 12px", marginBottom: 10, border: "1px solid #ddd6fe" }}>
              <pre style={{ fontSize: 11, color: "#334155", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit" }}>{answer}</pre>
              {pendingPlan ? (
                <button
                  style={{ marginTop: 8, width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  onClick={applyPendingPlan}
                >
                  Apply suggestion
                </button>
              ) : null}
              <button style={ghostBtn} onClick={() => { setAnswer(""); setAskState("idle"); }}>Clear</button>
            </div>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); } }}
            placeholder={`What do you want to do in ${manifest.name}?`}
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", color: "#0f172a" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>⌘↵ to send</span>
            <button
              onClick={ask}
              disabled={askState === "loading" || !prompt.trim()}
              style={{ background: askState === "loading" || !prompt.trim() ? "#ddd6fe" : "#7c3aed", color: "#fff", border: "none", borderRadius: 7, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: askState === "loading" ? "wait" : "pointer" }}
            >
              {askState === "loading" ? "…" : "Ask"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = { background: "none", border: "none", color: "#7c3aed", cursor: "pointer", padding: "4px 0 0", fontSize: 10, fontWeight: 600 };
const sectionTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, margin: "0 0 8px" };
const miniLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: "#64748b", margin: "10px 0 5px" };
const segmentedGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 5 };
const optionButton: React.CSSProperties = { minHeight: 30, border: "1px solid #e8edf5", borderRadius: 7, padding: "5px 6px", fontSize: 10, fontWeight: 900, cursor: "pointer", textTransform: "capitalize" };
