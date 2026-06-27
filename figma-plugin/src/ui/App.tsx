import { useEffect, useReducer, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StyleInfo = { id: string; name: string; description: string };
type ComponentInfo = { id: string; name: string; type: string; description: string };
type PageInfo = { id: string; name: string };

type FigmaPrimitives = {
  fileName: string;
  currentPage: string;
  components: ComponentInfo[];
  textStyles: StyleInfo[];
  paintStyles: StyleInfo[];
  effectStyles: StyleInfo[];
  pages: PageInfo[];
};

type WorkspaceBlock = {
  id: string;
  type: string;
  title: string;
  content?: string;
  items?: string[];
  actions?: { label: string; nodeId?: string }[];
};

type State =
  | { phase: "loading" }
  | { phase: "ready"; primitives: FigmaPrimitives; prompt: string }
  | { phase: "generating"; primitives: FigmaPrimitives; prompt: string }
  | { phase: "workspace"; primitives: FigmaPrimitives; prompt: string; blocks: WorkspaceBlock[] }
  | { phase: "error"; message: string };

type Action =
  | { type: "PRIMITIVES_READY"; primitives: FigmaPrimitives }
  | { type: "SET_PROMPT"; prompt: string }
  | { type: "GENERATE" }
  | { type: "WORKSPACE_READY"; blocks: WorkspaceBlock[] }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PRIMITIVES_READY":
      return state.phase === "generating" || state.phase === "workspace"
        ? state
        : { phase: "ready", primitives: action.primitives, prompt: "" };
    case "SET_PROMPT":
      if (state.phase !== "ready" && state.phase !== "workspace") return state;
      return { ...state, prompt: action.prompt };
    case "GENERATE":
      if (state.phase !== "ready" && state.phase !== "workspace") return state;
      return { phase: "generating", primitives: state.primitives, prompt: state.prompt };
    case "WORKSPACE_READY":
      if (state.phase !== "generating") return state;
      return { phase: "workspace", primitives: state.primitives, prompt: state.prompt, blocks: action.blocks };
    case "ERROR":
      return { phase: "error", message: action.message };
    case "RESET":
      if (state.phase === "workspace" || state.phase === "error")
        return { phase: "ready", primitives: (state as { primitives?: FigmaPrimitives }).primitives ?? ({ fileName: "", currentPage: "", components: [], textStyles: [], paintStyles: [], effectStyles: [], pages: [] } as FigmaPrimitives), prompt: "" };
      return state;
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACKEND = "http://localhost:3001";

function postToPlugin(msg: object) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function buildAdapterPrimitives(p: FigmaPrimitives) {
  const prims: object[] = [];

  prims.push({
    id: `figma:file:${p.fileName}`,
    source: "figma",
    type: "object",
    name: p.fileName,
    metadata: { kind: "file", currentPage: p.currentPage, pageCount: p.pages.length }
  });

  for (const c of p.components) {
    prims.push({
      id: `figma:component:${c.id}`,
      source: "figma",
      type: "object",
      name: c.name,
      metadata: { kind: "component", nodeId: c.id, componentType: c.type, description: c.description }
    });
  }

  for (const s of p.paintStyles) {
    prims.push({ id: `figma:style:paint:${s.id}`, source: "figma", type: "object", name: s.name, metadata: { kind: "color_style" } });
  }
  for (const s of p.textStyles) {
    prims.push({ id: `figma:style:text:${s.id}`, source: "figma", type: "object", name: s.name, metadata: { kind: "text_style" } });
  }

  prims.push({ id: "figma:action:open_file", source: "figma", type: "action", name: "Open in Figma", metadata: {} });
  prims.push({ id: "figma:action:add_comment", source: "figma", type: "action", name: "Add comment", metadata: {} });

  return prims;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" });
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Listen for messages from code.ts
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "PRIMITIVES_READY") {
        dispatch({ type: "PRIMITIVES_READY", primitives: msg.payload as FigmaPrimitives });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // When entering "generating" phase, call backend
  useEffect(() => {
    if (state.phase !== "generating") return;

    const primitives = buildAdapterPrimitives(state.primitives);
    const prompt = state.prompt.trim() || `Compose a workspace for ${state.primitives.fileName}`;

    fetch(`${BACKEND}/api/generate-workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, primitives })
    })
      .then((r) => r.json())
      .then((data: { schema?: { layout?: WorkspaceBlock[] } }) => {
        const blocks = data.schema?.layout ?? [];
        dispatch({ type: "WORKSPACE_READY", blocks });
      })
      .catch((err: Error) => dispatch({ type: "ERROR", message: err.message }));
  }, [state.phase]);

  // ── Render phases ────────────────────────────────────────────────────────────

  if (state.phase === "loading") {
    return (
      <div style={styles.center}>
        <Logo />
        <p style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>Reading file…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div style={styles.center}>
        <p style={{ color: "#ef4444", marginBottom: 12 }}>{state.message}</p>
        <button style={styles.btnSecondary} onClick={() => dispatch({ type: "RESET" })}>Try again</button>
      </div>
    );
  }

  if (state.phase === "workspace") {
    return (
      <div style={styles.root}>
        <Header fileName={state.primitives.fileName} onReset={() => dispatch({ type: "RESET" })} />
        <div style={styles.scroll}>
          {state.blocks.map((block) => (
            <Block key={block.id} block={block} />
          ))}
          {state.blocks.length === 0 && (
            <p style={{ color: "#94a3b8", padding: 16 }}>No blocks generated. Try a different prompt.</p>
          )}
        </div>
        <PromptBar
          value={state.prompt}
          onChange={(v) => dispatch({ type: "SET_PROMPT", prompt: v })}
          onGenerate={() => dispatch({ type: "GENERATE" })}
          loading={false}
          placeholder="Refine workspace…"
        />
      </div>
    );
  }

  if (state.phase === "generating") {
    return (
      <div style={styles.center}>
        <Logo />
        <Spinner />
        <p style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>Composing workspace…</p>
      </div>
    );
  }

  // ready
  const p = state.primitives;
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <Logo small />
        <span style={styles.fileName}>{p.fileName}</span>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div style={styles.statsRow}>
          <Stat label="Components" value={p.components.length} />
          <Stat label="Colors" value={p.paintStyles.length} />
          <Stat label="Text styles" value={p.textStyles.length} />
          <Stat label="Pages" value={p.pages.length} />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <PromptBar
        value={state.prompt}
        onChange={(v) => dispatch({ type: "SET_PROMPT", prompt: v })}
        onGenerate={() => dispatch({ type: "GENERATE" })}
        loading={false}
        placeholder={`What do you want to do in ${p.fileName}?`}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ fileName, onReset }: { fileName: string; onReset: () => void }) {
  return (
    <div style={styles.header}>
      <Logo small />
      <span style={styles.fileName}>{fileName}</span>
      <button style={styles.btnGhost} onClick={onReset}>← Back</button>
    </div>
  );
}

function Block({ block }: { block: WorkspaceBlock }) {
  return (
    <div style={styles.block}>
      <p style={styles.blockTitle}>{block.title}</p>
      {block.content && <p style={styles.blockContent}>{block.content}</p>}
      {block.items && (
        <ul style={styles.list}>
          {block.items.map((item, i) => <li key={i} style={styles.listItem}>{item}</li>)}
        </ul>
      )}
      {block.actions && block.actions.length > 0 && (
        <div style={styles.actionRow}>
          {block.actions.map((a, i) => (
            <button
              key={i}
              style={styles.btnAction}
              onClick={() => {
                if (a.nodeId) postToPlugin({ type: "SELECT_NODE", nodeId: a.nodeId });
                else postToPlugin({ type: "NOTIFY", message: `${a.label} — coming soon` });
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PromptBar({ value, onChange, onGenerate, loading, placeholder }: {
  value: string; onChange: (v: string) => void; onGenerate: () => void; loading: boolean; placeholder: string;
}) {
  return (
    <div style={styles.promptBar}>
      <textarea
        style={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onGenerate(); } }}
      />
      <button style={loading ? styles.btnPrimaryDisabled : styles.btnPrimary} onClick={onGenerate} disabled={loading}>
        {loading ? "…" : "Generate"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: small ? 18 : 28, height: small ? 18 : 28, borderRadius: small ? 5 : 8, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: small ? 10 : 14, fontWeight: 700 }}>D</span>
      </div>
      {!small && <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Dynara</span>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 24, height: 24, border: "2.5px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginTop: 16 }} />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: 24 },
  header: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #f1f5f9" },
  fileName: { flex: 1, fontSize: 12, fontWeight: 600, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  scroll: { flex: 1, overflowY: "auto", padding: "8px 0" },
  block: { margin: "0 12px 8px", padding: "10px 12px", borderRadius: 8, border: "1px solid #f1f5f9", background: "#fafafa" },
  blockTitle: { fontWeight: 600, fontSize: 12, color: "#0f172a", marginBottom: 4 },
  blockContent: { fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  list: { paddingLeft: 16, marginTop: 4 },
  listItem: { fontSize: 12, color: "#475569", marginBottom: 2 },
  actionRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  statsRow: { display: "flex", gap: 8, marginBottom: 8 },
  stat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", borderRadius: 8, background: "#f8fafc", border: "1px solid #f1f5f9" },
  statValue: { fontWeight: 700, fontSize: 16, color: "#7c3aed" },
  statLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  promptBar: { display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid #f1f5f9", alignItems: "flex-end" },
  textarea: { flex: 1, resize: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", lineHeight: 1.5, color: "#0f172a" },
  btnPrimary: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  btnPrimaryDisabled: { background: "#c4b5fd", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "not-allowed", whiteSpace: "nowrap" },
  btnSecondary: { background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "none", border: "none", color: "#7c3aed", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "4px 0" },
  btnAction: { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" },
};

// Inject spin keyframe
const style = document.createElement("style");
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
