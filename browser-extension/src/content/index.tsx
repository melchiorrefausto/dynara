import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DynaraPanel } from "./Panel";

// Only inject on real pages (not extension pages, pdfs, etc.)
if (document.body && window.location.protocol.startsWith("http")) {
  const host = document.createElement("div");
  host.id = "__dynara_host__";
  host.style.cssText = "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Reset styles inside Shadow DOM
  const resetStyle = document.createElement("style");
  resetStyle.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`;
  shadow.appendChild(resetStyle);

  const container = document.createElement("div");
  shadow.appendChild(container);

  function Root() {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;
    return <DynaraPanel onClose={() => setVisible(false)} />;
  }

  createRoot(container).render(<Root />);

  // Listen for toggle message from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_PANEL") {
      const root = shadow.querySelector("div");
      if (root) root.style.display = root.style.display === "none" ? "" : "none";
    }
  });
}
