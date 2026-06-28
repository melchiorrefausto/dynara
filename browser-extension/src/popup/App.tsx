import { useEffect, useState } from "react";

const SUPPORTED = [
  { name: "Figma", host: "figma.com", color: "#1abcfe" },
  { name: "Linear", host: "linear.app", color: "#5e6ad2" },
  { name: "Notion", host: "notion.so", color: "#000" },
];

export function App() {
  const [currentHost, setCurrentHost] = useState("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        const url = new URL(tabs[0]?.url ?? "");
        setCurrentHost(url.hostname);
      } catch { /* ignore */ }
    });
  }, []);

  const togglePanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_PANEL" });
        window.close();
      }
    });
  };

  const detected = SUPPORTED.find((s) => currentHost.includes(s.host));

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>D</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Dynara</span>
      </div>

      {/* Current site */}
      <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
        {detected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: detected.color, display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{detected.name} — supported</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#64748b" }}>{currentHost || "No active tab"}</span>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={togglePanel}
        style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%" }}
      >
        Toggle Dynara panel
      </button>

      {/* Supported apps */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Supported apps</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {SUPPORTED.map((s) => (
            <div key={s.host} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
