import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DynaraPanel } from "./Panel";

if (document.body && window.location.protocol.startsWith("http")) {
  const container = document.createElement("div");
  container.id = "__dynara_root__";
  // Reset everything on the container so Figma/app styles don't leak in
  container.style.cssText = [
    "all: initial",
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 0",
    "height: 0",
    "z-index: 2147483647",
    "pointer-events: none",
    "font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
  ].join(";");
  document.documentElement.appendChild(container);

  function Root() {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;
    return <DynaraPanel onClose={() => setVisible(false)} />;
  }

  createRoot(container).render(<Root />);

  // Toggle from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_PANEL") {
      container.style.display = container.style.display === "none" ? "" : "none";
    }
  });
}
