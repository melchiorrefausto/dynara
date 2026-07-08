import { useEffect, useState, useCallback } from "react";
import { DEFAULT_MANIFEST, type DynaraManifest, type ManifestPanel, type ManifestView } from "../shared/manifest";
import { getBackendUrl, setBackendUrl } from "../shared/config";

type AskState = "idle" | "loading" | "done";

export function App() {
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [manifest, setManifest] = useState<DynaraManifest>(DEFAULT_MANIFEST);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [askState, setAskState] = useState<AskState>("idle");
  const [answer, setAnswer] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [backend, setBackend] = useState("");
  const [editingBackend, setEditingBackend] = useState(false);

  useEffect(() => {
    getBackendUrl().then(setBackend);
  }, []);

  const syncState = useCallback((id: number) => {
    chrome.runtime.sendMessage({ type: "GET_TAB_STATE", tabId: id }, (res) => {
      if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
    });
    chrome.runtime.sendMessage({ type: "GET_MANIFEST_IN_TAB", tabId: id }, (res) => {
      if (!chrome.runtime.lastError && res?.manifest) setManifest(res.manifest);
      else setManifest(DEFAULT_MANIFEST);
      setActiveView(null);
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
      { type: "APPLY_VIEW_IN_TAB", tabId, panels: manifest.panels, visiblePanelIds: view.panels },
      (res) => {
        if (!chrome.runtime.lastError && res?.hidden) setHidden(new Set(res.hidden));
        setActiveView(view.id);
      }
    );
  };

  const triggerAction = (actionId: string, label: string) => {
    if (!tabId) return;
    chrome.runtime.sendMessage({ type: "TRIGGER_ACTION_IN_TAB", tabId, actionId }, () => {
      setActionFeedback(`Triggered "${label}"`);
      setTimeout(() => setActionFeedback(null), 2000);
    });
  };

  const ask = async () => {
    if (!prompt.trim()) return;
    setAskState("loading");
    try {
      const res = await fetch(`${backend}/api/generate-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          primitives: [{ id: "context", source: manifest.name.toLowerCase(), type: "object", name: manifest.name, metadata: { url } }]
        })
      });
      const data = await res.json() as { schema?: { description?: string; layout?: { title: string; content?: string; items?: string[] }[] } };
      const blocks = data.schema?.layout ?? [];
      const text = blocks.map((b) => [b.title, b.content, ...(b.items ?? []).map((i) => `• ${i}`)].filter(Boolean).join("\n")).join("\n\n");
      setAnswer(text || data.schema?.description || "No answer.");
      setAskState("done");
    } catch {
      setAnswer(`Could not reach Dynara backend (${backend}).`);
      setAskState("done");
    }
  };

  const saveBackend = (value: string) => {
    const next = value.trim() || backend;
    setBackend(next);
    setEditingBackend(false);
    void setBackendUrl(next);
  };

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif", fontSize: 13, color: "#0f172a", height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
                    border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer"
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
          <p style={sectionTitle}>Interface controls</p>
          {manifest.panels.length === 0 ? (
            <p style={{ fontSize: 11, color: "#94a3b8" }}>No controls for this app yet. Add a Dynara manifest to enable them.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {manifest.panels.map((panel) => {
                const isHidden = hidden.has(panel.id);
                return (
                  <div key={panel.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", width: 38, flexShrink: 0 }}>{panel.side ?? ""}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#334155" }}>{panel.label}</span>
                    <button
                      onClick={() => togglePanel(panel)}
                      style={{ background: isHidden ? "#f1f5f9" : "#7c3aed", color: isHidden ? "#64748b" : "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
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
              <p style={{ fontSize: 11, color: "#16a34a", margin: "0 0 6px" }}>{actionFeedback}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {manifest.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => triggerAction(action.id, action.label)}
                  style={{ background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                >
                  {action.label}
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
