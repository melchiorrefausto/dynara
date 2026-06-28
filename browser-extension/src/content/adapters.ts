export type AppAdapter = {
  name: string;
  color: string;
  panels: Panel[];
  extractContext: () => AppContext;
};

export type Panel = {
  id: string;
  label: string;
  side: "left" | "right" | "bottom" | "top";
  toggle: () => void;
  isHidden: () => boolean;
};

export type AppContext = {
  appName: string;
  pageTitle: string;
  url: string;
  extraInfo?: string;
};

// ─── Keyboard shortcut helper ─────────────────────────────────────────────────

function triggerShortcut(key: string, opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}) {
  const el = document.activeElement ?? document.body;
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  el.dispatchEvent(new KeyboardEvent("keydown", {
    key,
    code: `Key${key.toUpperCase()}`,
    ctrlKey: !isMac && (opts.ctrlKey ?? false),
    metaKey: isMac && (opts.ctrlKey ?? false),
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    bubbles: true,
    cancelable: true
  }));
}

// ─── CSS hide/show helper ─────────────────────────────────────────────────────

const hiddenPanels = new Set<string>();

function cssHide(panelId: string, selector: string) {
  const styleId = `dynara-hide-${panelId}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `${selector} { display: none !important; transition: none !important; }`;
  document.head.appendChild(style);
  hiddenPanels.add(panelId);
}

function cssShow(panelId: string) {
  document.getElementById(`dynara-hide-${panelId}`)?.remove();
  hiddenPanels.delete(panelId);
}

function cssToggle(panelId: string, selector: string) {
  hiddenPanels.has(panelId) ? cssShow(panelId) : cssHide(panelId, selector);
}

// ─── Figma adapter ────────────────────────────────────────────────────────────
// Figma's DOM uses stable data-testid attributes and positional selectors.
// We target structural positions rather than minified class names.

const figmaAdapter: AppAdapter = {
  name: "Figma",
  color: "#1abcfe",
  panels: [
    {
      id: "figma-left",
      label: "Layers & Assets",
      side: "left",
      toggle: () => triggerShortcut("\\", { ctrlKey: true }),
      isHidden: () => hiddenPanels.has("figma-left")
    },
    {
      id: "figma-toolbar",
      label: "Toolbar",
      side: "top",
      // Figma top toolbar: the bar above the canvas with tool buttons
      toggle: () => cssToggle("figma-toolbar", "[class*='toolbar_view']"),
      isHidden: () => hiddenPanels.has("figma-toolbar")
    },
    {
      id: "figma-right",
      label: "Design panel",
      side: "right",
      // Figma right panel sits on the right side of the canvas
      toggle: () => cssToggle("figma-right", "[class*='properties_panel'], [class*='inspector']"),
      isHidden: () => hiddenPanels.has("figma-right")
    },
    {
      id: "figma-bottom",
      label: "Bottom bar",
      side: "bottom",
      toggle: () => cssToggle("figma-bottom", "[class*='footer'], [class*='status_bar']"),
      isHidden: () => hiddenPanels.has("figma-bottom")
    }
  ],
  extractContext: () => ({
    appName: "Figma",
    pageTitle: document.title,
    url: window.location.href,
    extraInfo: window.location.pathname.split("/")[2] ?? ""
  })
};

// ─── Linear adapter ───────────────────────────────────────────────────────────

const linearAdapter: AppAdapter = {
  name: "Linear",
  color: "#5e6ad2",
  panels: [
    {
      id: "linear-sidebar",
      label: "Sidebar",
      side: "left",
      toggle: () => cssToggle("linear-sidebar", "[class*='Sidebar'], nav[class*='sidebar'], aside"),
      isHidden: () => hiddenPanels.has("linear-sidebar")
    }
  ],
  extractContext: () => ({
    appName: "Linear",
    pageTitle: document.title,
    url: window.location.href
  })
};

// ─── Notion adapter ───────────────────────────────────────────────────────────

const notionAdapter: AppAdapter = {
  name: "Notion",
  color: "#000",
  panels: [
    {
      id: "notion-sidebar",
      label: "Sidebar",
      side: "left",
      toggle: () => cssToggle("notion-sidebar", ".notion-sidebar-container, [class*='sidebar']"),
      isHidden: () => hiddenPanels.has("notion-sidebar")
    }
  ],
  extractContext: () => ({
    appName: "Notion",
    pageTitle: document.title,
    url: window.location.href
  })
};

// ─── Default adapter ──────────────────────────────────────────────────────────

const defaultAdapter: AppAdapter = {
  name: "Web app",
  color: "#7c3aed",
  panels: [],
  extractContext: () => ({
    appName: document.title || window.location.hostname,
    pageTitle: document.title,
    url: window.location.href
  })
};

// ─── Detect current app ───────────────────────────────────────────────────────

export function detectAdapter(): AppAdapter {
  const host = window.location.hostname;
  if (host.includes("figma.com"))  return figmaAdapter;
  if (host.includes("linear.app")) return linearAdapter;
  if (host.includes("notion.so"))  return notionAdapter;
  return defaultAdapter;
}
