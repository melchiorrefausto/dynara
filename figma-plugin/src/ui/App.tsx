import { useEffect, useReducer, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComponentInfo = { id: string; name: string; type: string; description: string; width: number; height: number };
type PaintStyle  = { id: string; name: string; hex: string; description: string };
type TextStyle   = { id: string; name: string; fontSize: number; fontFamily: string; fontWeight: string; description: string };
type EffectStyle = { id: string; name: string; description: string };
type PageInfo    = { id: string; name: string; isCurrent: boolean };

type Primitives = {
  fileName: string;
  currentPage: string;
  components: ComponentInfo[];
  paintStyles: PaintStyle[];
  textStyles: TextStyle[];
  effectStyles: EffectStyle[];
  pages: PageInfo[];
};

type Tab = "components" | "colors" | "text" | "pages";

type State =
  | { phase: "loading" }
  | { phase: "browse"; primitives: Primitives; tab: Tab; query: string }
  | { phase: "asking"; primitives: Primitives; tab: Tab; query: string }
  | { phase: "answer"; primitives: Primitives; tab: Tab; query: string; answer: string };

type Action =
  | { type: "PRIMITIVES_READY"; primitives: Primitives }
  | { type: "SET_TAB"; tab: Tab }
  | { type: "SET_QUERY"; query: string }
  | { type: "ASK" }
  | { type: "ANSWER"; answer: string }
  | { type: "CLEAR_ANSWER" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PRIMITIVES_READY":
      return { phase: "browse", primitives: action.primitives, tab: "components", query: "" };
    case "SET_TAB":
      if (state.phase === "loading") return state;
      return { ...state, tab: action.tab, phase: "browse" };
    case "SET_QUERY":
      if (state.phase === "loading") return state;
      return { ...state, query: action.query, phase: "browse" };
    case "ASK":
      if (state.phase === "loading") return state;
      return { ...state, phase: "asking" };
    case "ANSWER":
      if (state.phase !== "asking") return state;
      return { ...state, phase: "answer", answer: action.answer };
    case "CLEAR_ANSWER":
      if (state.phase !== "answer") return state;
      return { ...state, phase: "browse", query: "" };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACKEND = "http://localhost:3001";

function post(msg: object) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function useFilter<T extends { name: string }>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((i) => i.name.toLowerCase().includes(q));
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "PRIMITIVES_READY") {
        dispatch({ type: "PRIMITIVES_READY", primitives: msg.payload as Primitives });
      }
    };
    window.addEventListener("message", handler);
    post({ type: "GET_PRIMITIVES" });
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (state.phase !== "asking") return;
    const p = state.primitives;
    const context = [
      `File: ${p.fileName}`,
      `Components (${p.components.length}): ${p.components.slice(0, 20).map((c) => c.name).join(", ")}`,
      `Colors (${p.paintStyles.length}): ${p.paintStyles.slice(0, 10).map((s) => s.name).join(", ")}`,
      `Text styles (${p.textStyles.length}): ${p.textStyles.slice(0, 10).map((s) => s.name).join(", ")}`,
      `Pages: ${p.pages.map((pg) => pg.name).join(", ")}`
    ].join("\n");

    fetch(`${BACKEND}/api/generate-workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: state.query,
        primitives: [{ id: "context", source: "figma", type: "object", name: p.fileName, metadata: { context } }]
      })
    })
      .then((r) => r.json())
      .then((data: { schema?: { description?: string; layout?: { title: string; content?: string; items?: string[] }[] } }) => {
        const blocks = data.schema?.layout ?? [];
        const text = blocks.map((b) => [b.title, b.content ?? "", ...(b.items ?? []).map((i) => `• ${i}`)].filter(Boolean).join("\n")).join("\n\n");
        dispatch({ type: "ANSWER", answer: text || data.schema?.description || "No answer generated." });
      })
      .catch(() => dispatch({ type: "ANSWER", answer: "Could not reach Dynara backend. Make sure localhost:3001 is running." }));
  }, [state.phase]);

  if (state.phase === "loading") {
    return (
      <div style={s.center}>
        <LogoMark />
        <p style={{ marginTop: 10, color: "#94a3b8", fontSize: 11 }}>Reading file…</p>
      </div>
    );
  }

  const p = state.primitives;

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <LogoMark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={s.fileName}>{p.fileName}</p>
          <p style={s.pageName}>{p.currentPage}</p>
        </div>
        <PagePicker pages={p.pages} />
      </div>

      {/* AI answer overlay */}
      {state.phase === "answer" && (
        <div style={s.answerBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>Dynara</span>
            <button style={s.btnGhost} onClick={() => dispatch({ type: "CLEAR_ANSWER" })}>✕ Close</button>
          </div>
          <pre style={s.answerText}>{state.answer}</pre>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {(["components", "colors", "text", "pages"] as Tab[]).map((t) => (
          <button
            key={t}
            style={state.tab === t ? s.tabActive : s.tab}
            onClick={() => dispatch({ type: "SET_TAB", tab: t })}
          >
            {t === "components" ? `Components ${p.components.length}` :
             t === "colors"     ? `Colors ${p.paintStyles.length}` :
             t === "text"       ? `Text ${p.textStyles.length}` :
                                  `Pages ${p.pages.length}`}
          </button>
        ))}
      </div>

      {/* Search */}
      {state.tab !== "pages" && (
        <div style={s.searchRow}>
          <input
            style={s.search}
            placeholder={`Search ${state.tab}…`}
            value={state.query}
            onChange={(e) => dispatch({ type: "SET_QUERY", query: e.target.value })}
          />
          {state.query && (
            <button style={s.btnGhost} onClick={() => dispatch({ type: "SET_QUERY", query: "" })}>✕</button>
          )}
        </div>
      )}

      {/* Content */}
      <div style={s.scroll}>
        {state.tab === "components" && <ComponentsTab items={useFilter(p.components, state.query)} query={state.query} />}
        {state.tab === "colors"     && <ColorsTab items={useFilter(p.paintStyles, state.query)} query={state.query} />}
        {state.tab === "text"       && <TextTab items={useFilter(p.textStyles, state.query)} query={state.query} />}
        {state.tab === "pages"      && <PagesTab pages={p.pages} />}
      </div>

      {/* AI prompt bar */}
      <AskBar
        loading={state.phase === "asking"}
        onAsk={(q) => { dispatch({ type: "SET_QUERY", query: q }); dispatch({ type: "ASK" }); }}
      />
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function ComponentsTab({ items, query }: { items: ComponentInfo[]; query: string }) {
  if (items.length === 0) {
    return <Empty>{query ? `No components matching "${query}"` : "No components in this page. Try switching pages."}</Empty>;
  }
  return (
    <div style={s.grid}>
      {items.map((c) => (
        <button key={c.id} style={s.componentCard} onClick={() => post({ type: "SELECT_NODE", nodeId: c.id })}>
          <div style={s.componentPreview}>
            <span style={{ fontSize: 16 }}>{c.type === "COMPONENT_SET" ? "⊞" : "◻"}</span>
          </div>
          <p style={s.componentName}>{c.name}</p>
          {c.width > 0 && <p style={s.componentMeta}>{c.width}×{c.height}</p>}
        </button>
      ))}
    </div>
  );
}

function ColorsTab({ items, query }: { items: PaintStyle[]; query: string }) {
  if (items.length === 0) {
    return <Empty>{query ? `No colors matching "${query}"` : "No color styles defined in this file."}</Empty>;
  }
  return (
    <div style={{ padding: "8px 12px" }}>
      {items.map((c) => (
        <div key={c.id} style={s.colorRow}>
          <div style={{ ...s.swatch, background: c.hex }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.itemName}>{c.name}</p>
            <p style={s.itemMeta}>{c.hex}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextTab({ items, query }: { items: TextStyle[]; query: string }) {
  if (items.length === 0) {
    return <Empty>{query ? `No text styles matching "${query}"` : "No text styles defined in this file."}</Empty>;
  }
  return (
    <div style={{ padding: "8px 12px" }}>
      {items.map((t) => (
        <div key={t.id} style={s.textRow}>
          <p style={{ ...s.textSample, fontFamily: t.fontFamily, fontSize: Math.min(t.fontSize, 20), fontWeight: t.fontWeight === "Bold" ? 700 : t.fontWeight === "Medium" ? 500 : 400 }}>
            Aa
          </p>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.itemName}>{t.name}</p>
            <p style={s.itemMeta}>{t.fontFamily} {t.fontWeight} · {t.fontSize}px</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PagesTab({ pages }: { pages: PageInfo[] }) {
  return (
    <div style={{ padding: "8px 12px" }}>
      {pages.map((pg) => (
        <button
          key={pg.id}
          style={pg.isCurrent ? s.pageRowActive : s.pageRow}
          onClick={() => post({ type: "NAVIGATE_PAGE", pageId: pg.id })}
        >
          <span style={{ fontSize: 14 }}>◈</span>
          <span style={s.itemName}>{pg.name}</span>
          {pg.isCurrent && <span style={s.badge}>current</span>}
        </button>
      ))}
    </div>
  );
}

function PagePicker({ pages }: { pages: PageInfo[] }) {
  const [open, setOpen] = useState(false);
  if (pages.length <= 1) return null;
  return (
    <div style={{ position: "relative" }}>
      <button style={s.btnGhost} onClick={() => setOpen((v) => !v)}>Pages ▾</button>
      {open && (
        <div style={s.dropdown}>
          {pages.map((pg) => (
            <button key={pg.id} style={s.dropItem} onClick={() => { post({ type: "NAVIGATE_PAGE", pageId: pg.id }); setOpen(false); }}>
              {pg.isCurrent ? "● " : "○ "}{pg.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AskBar({ loading, onAsk }: { loading: boolean; onAsk: (q: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={s.askBar}>
      <input
        style={s.askInput}
        placeholder="Ask Dynara anything about this file…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAsk(val.trim()); setVal(""); } }}
      />
      <button
        style={loading || !val.trim() ? s.askBtnDisabled : s.askBtn}
        disabled={loading || !val.trim()}
        onClick={() => { if (val.trim()) { onAsk(val.trim()); setVal(""); } }}
      >
        {loading ? "…" : "Ask"}
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "#94a3b8", fontSize: 12, padding: "24px 16px", textAlign: "center" }}>{children}</p>;
}

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>D</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root:           { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#fff" },
  center:         { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" },
  header:         { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 8px", borderBottom: "1px solid #f1f5f9" },
  fileName:       { fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 },
  pageName:       { fontSize: 10, color: "#94a3b8", margin: 0, marginTop: 1 },
  tabs:           { display: "flex", gap: 0, borderBottom: "1px solid #f1f5f9", overflowX: "auto" },
  tab:            { flex: 1, padding: "7px 4px", border: "none", background: "none", fontSize: 10, fontWeight: 600, color: "#94a3b8", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2px solid transparent" },
  tabActive:      { flex: 1, padding: "7px 4px", border: "none", background: "none", fontSize: 10, fontWeight: 700, color: "#7c3aed", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2px solid #7c3aed" },
  searchRow:      { display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderBottom: "1px solid #f8fafc" },
  search:         { flex: 1, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 11, outline: "none", color: "#0f172a", background: "#f8fafc" },
  scroll:         { flex: 1, overflowY: "auto" },
  grid:           { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "8px 12px" },
  componentCard:  { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", borderRadius: 8, border: "1px solid #f1f5f9", background: "#fafafa", cursor: "pointer", textAlign: "center" as const },
  componentPreview: { width: 36, height: 36, borderRadius: 6, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" },
  componentName:  { fontSize: 10, fontWeight: 600, color: "#334155", margin: 0, wordBreak: "break-word" as const, lineHeight: 1.3 },
  componentMeta:  { fontSize: 9, color: "#94a3b8", margin: 0 },
  colorRow:       { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f8fafc" },
  swatch:         { width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0 },
  textRow:        { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f8fafc" },
  textSample:     { width: 40, textAlign: "center" as const, color: "#334155", flexShrink: 0, margin: 0 },
  itemName:       { fontSize: 11, fontWeight: 600, color: "#334155", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemMeta:       { fontSize: 10, color: "#94a3b8", margin: 0 },
  pageRow:        { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 0", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f8fafc", textAlign: "left" as const },
  pageRowActive:  { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 0", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f8fafc", textAlign: "left" as const, color: "#7c3aed" },
  badge:          { fontSize: 9, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", borderRadius: 4, padding: "2px 5px" },
  answerBox:      { margin: "8px 12px 0", padding: "10px 12px", borderRadius: 8, background: "#f5f3ff", border: "1px solid #ddd6fe" },
  answerText:     { fontSize: 11, color: "#334155", margin: 0, whiteSpace: "pre-wrap" as const, lineHeight: 1.6, fontFamily: "inherit" },
  askBar:         { display: "flex", gap: 6, padding: "8px 12px", borderTop: "1px solid #f1f5f9" },
  askInput:       { flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 11, outline: "none", fontFamily: "inherit", color: "#0f172a" },
  askBtn:         { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  askBtnDisabled: { background: "#ddd6fe", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "not-allowed" },
  btnGhost:       { background: "none", border: "none", color: "#7c3aed", fontSize: 10, fontWeight: 700, cursor: "pointer", padding: "3px 4px" },
  dropdown:       { position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, minWidth: 140 },
  dropItem:       { display: "block", width: "100%", padding: "7px 12px", border: "none", background: "none", fontSize: 11, cursor: "pointer", textAlign: "left" as const, color: "#334155" },
};
