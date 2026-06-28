import { useState, useEffect, useRef, useCallback } from "react";
import { detectAdapter, type AppAdapter, type Panel } from "./adapters";

const BACKEND = "http://localhost:3001";

type AskState = "idle" | "loading" | "done";

export function DynaraPanel({ onClose }: { onClose: () => void }) {
  const adapter = useRef<AppAdapter>(detectAdapter());
  const [panels, setPanels] = useState<Panel[]>(adapter.current.panels);
  const [prompt, setPrompt] = useState("");
  const [askState, setAskState] = useState<AskState>("idle");
  const [answer, setAnswer] = useState("");
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: 60 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const refresh = useCallback(() => {
    setPanels([...adapter.current.panels]);
  }, []);

  const togglePanel = (panel: Panel) => {
    panel.toggle();
    setTimeout(refresh, 50);
  };

  const ask = async () => {
    if (!prompt.trim()) return;
    setAskState("loading");
    const ctx = adapter.current.extractContext();
    try {
      const res = await fetch(`${BACKEND}/api/generate-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          primitives: [{
            id: "context",
            source: ctx.appName.toLowerCase(),
            type: "object",
            name: ctx.appName,
            metadata: { pageTitle: ctx.pageTitle, url: ctx.url, extra: ctx.extraInfo ?? "" }
          }]
        })
      });
      const data = (await res.json()) as { schema?: { description?: string; layout?: { title: string; content?: string; items?: string[] }[] } };
      const blocks = data.schema?.layout ?? [];
      const text = blocks
        .map((b) => [b.title, b.content, ...(b.items ?? []).map((i) => `• ${i}`)].filter(Boolean).join("\n"))
        .join("\n\n");
      setAnswer(text || data.schema?.description || "No answer.");
      setAskState("done");
    } catch {
      setAnswer("Could not reach Dynara backend (localhost:3001).");
      setAskState("done");
    }
  };

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const app = adapter.current;

  return (
    <div style={{
      all: "initial" as const,
      position: "fixed", left: pos.x, top: pos.y, width: 300,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      border: "1px solid #e2e8f0", fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif",
      fontSize: 13, color: "#0f172a", zIndex: 2147483647, overflow: "hidden",
      userSelect: "none", pointerEvents: "auto", display: "block"
    }}>
      {/* Header — drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fafafa", borderBottom: "1px solid #f1f5f9", cursor: "grab" }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>D</span>
        </div>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 12 }}>Dynara</span>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: app.color + "22", color: app.color }}>{app.name}</span>
        <button onClick={() => setMinimized(v => !v)} style={ghostBtn}>{minimized ? "▲" : "▼"}</button>
        <button onClick={onClose} style={ghostBtn}>✕</button>
      </div>

      {!minimized && (
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {/* Interface Controls */}
          <div style={{ padding: "10px 12px" }}>
            <p style={sectionTitle}>Interface controls</p>
            {panels.length === 0 && (
              <p style={{ fontSize: 11, color: "#94a3b8" }}>No panel controls for this app yet.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {panels.map((panel) => (
                <PanelToggle key={panel.id} panel={panel} onToggle={() => togglePanel(panel)} />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />

          {/* AI Workspace */}
          <div style={{ padding: "10px 12px" }}>
            <p style={sectionTitle}>Ask Dynara</p>
            {askState === "done" && answer && (
              <div style={{ background: "#f5f3ff", borderRadius: 8, padding: "8px 10px", marginBottom: 8, border: "1px solid #ddd6fe" }}>
                <pre style={{ fontSize: 11, color: "#334155", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit" }}>{answer}</pre>
                <button style={{ ...ghostBtn, marginTop: 4, fontSize: 10 }} onClick={() => { setAnswer(""); setAskState("idle"); }}>Clear</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`What do you want to do in ${app.name}?`}
                rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); } }}
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 8px", fontSize: 11, fontFamily: "inherit", resize: "none", outline: "none", color: "#0f172a" }}
              />
              <button
                onClick={ask}
                disabled={askState === "loading" || !prompt.trim()}
                style={{ background: askState === "loading" || !prompt.trim() ? "#ddd6fe" : "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: askState === "loading" ? "wait" : "pointer", alignSelf: "stretch" }}
              >
                {askState === "loading" ? "…" : "Ask"}
              </button>
            </div>
            <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>⌘↵ to send</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelToggle({ panel, onToggle }: { panel: Panel; onToggle: () => void }) {
  const hidden = panel.isHidden();
  const sideIcon = { left: "⬛", right: "⬛", top: "⬛", bottom: "⬛" }[panel.side];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 10, color: "#94a3b8" }}>{sideIcon} {panel.side}</span>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#334155" }}>{panel.label}</span>
      <button
        onClick={onToggle}
        style={{
          background: hidden ? "#f1f5f9" : "#7c3aed",
          color: hidden ? "#64748b" : "#fff",
          border: "none", borderRadius: 5, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer"
        }}
      >
        {hidden ? "Show" : "Hide"}
      </button>
    </div>
  );
}

const ghostBtn: React.CSSProperties = { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px 4px", fontSize: 12, lineHeight: 1 };
const sectionTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 };
