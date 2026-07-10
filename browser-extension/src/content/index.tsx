// Content script — discovers the page's Dynara manifest and applies panel/view
// toggles + action triggers in response to messages from the side panel.
// No React UI here; all UI lives in the native Chrome Side Panel.

import { normalizeManifest, DEFAULT_MANIFEST, type DynaraManifest, type InterfacePlan, type UserInterfaceProfile } from "../shared/manifest";
import { auditManifestContrast, failingContrast } from "../shared/contrast";

const dynaraGlobal = globalThis as typeof globalThis & {
  __DYNARA_CONTENT_SCRIPT_LOADED__?: boolean;
};

if (window === window.top && window.location.protocol.startsWith("http") && document.documentElement && !dynaraGlobal.__DYNARA_CONTENT_SCRIPT_LOADED__) {
  dynaraGlobal.__DYNARA_CONTENT_SCRIPT_LOADED__ = true;

  const hidden = new Set<string>();
  const activeActionClasses = new Set<string>();
  let manifestPromise: Promise<DynaraManifest> | null = null;
  let activeProfileId: string | null = null;
  let activeViewId: string | null = null;
  let currentTokenOverrides: Record<string, string> = {};
  let inspectMode = false;
  let hoveredSurface: SelectedSurface | null = null;
  let selectedSurface: SelectedSurface | null = null;
  let surfaceStyles: Record<string, SurfaceStyle> = {};
  let activeManifest: DynaraManifest | null = null;

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

  const TOKEN_CSS_VARIABLES: Record<string, string> = {
    "color-background": "--background",
    "color-foreground": "--foreground",
    "color-card": "--card",
    "color-card-foreground": "--card-foreground",
    "color-primary": "--primary",
    "color-primary-foreground": "--primary-foreground",
    "color-secondary": "--secondary",
    "color-secondary-foreground": "--secondary-foreground",
    "color-muted": "--muted",
    "color-muted-foreground": "--muted-foreground",
    "color-accent": "--accent",
    "color-accent-foreground": "--accent-foreground",
    "color-border": "--border",
    "color-ring": "--ring",
    "radius-base": "--radius"
  };

	  const THEME_OVERRIDES: Record<string, Record<string, string>> = {
	    "theme-ocean": {
	      "color-background": "190 60% 97%",
	      "color-foreground": "200 56% 14%",
	      "color-card": "0 0% 100%",
	      "color-primary": "196 87% 33%",
	      "color-primary-foreground": "0 0% 100%",
	      "color-secondary": "190 45% 90%",
	      "color-muted": "190 35% 92%",
	      "color-muted-foreground": "198 22% 34%",
	      "color-accent": "176 72% 38%",
	      "color-accent-foreground": "0 0% 8%",
	      "color-border": "190 30% 82%",
	      "color-ring": "196 87% 33%"
	    },
    "theme-mono": {
      "color-background": "0 0% 98%",
      "color-foreground": "0 0% 6%",
      "color-card": "0 0% 100%",
      "color-primary": "0 0% 6%",
      "color-primary-foreground": "0 0% 100%",
      "color-secondary": "0 0% 93%",
	      "color-muted": "0 0% 93%",
	      "color-muted-foreground": "0 0% 36%",
	      "color-accent": "0 0% 16%",
	      "color-accent-foreground": "0 0% 100%",
	      "color-border": "0 0% 84%",
	      "color-ring": "0 0% 6%"
	    },
    "theme-sunset": {
      "color-background": "34 70% 97%",
      "color-foreground": "18 50% 14%",
      "color-card": "0 0% 100%",
      "color-primary": "346 77% 50%",
      "color-primary-foreground": "0 0% 100%",
      "color-secondary": "32 72% 90%",
	      "color-muted": "32 55% 91%",
	      "color-muted-foreground": "20 25% 36%",
	      "color-accent": "24 95% 53%",
	      "color-accent-foreground": "0 0% 8%",
	      "color-border": "28 42% 82%",
	      "color-ring": "346 77% 50%"
	    }
	  };

	  const HERO_ACTION_CLASSES = ["dynara-hero-showcase", "dynara-hero-compact", "dynara-hero-clean"];

  function applyHide(panelId: string, selector: string) {
    const id = `dynara-hide-${panelId}`;
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `${selector} { display: none !important; transition: none !important; }`;
    document.head.appendChild(style);
    hidden.add(panelId);
  }

  function applyShow(panelId: string) {
    document.getElementById(`dynara-hide-${panelId}`)?.remove();
    hidden.delete(panelId);
  }

  function ensureInspectorStyles() {
    if (document.getElementById("dynara-inspector-styles")) return;
    const style = document.createElement("style");
    style.id = "dynara-inspector-styles";
    style.textContent = `
      .dynara-inspect-overlay {
        position: fixed;
        z-index: 2147483647;
        pointer-events: none;
        border: 2px solid #7c3aed;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.08);
        background: rgba(124, 58, 237, 0.06);
        transition: top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease;
      }

      .dynara-inspect-label {
        position: absolute;
        left: 0;
        top: -28px;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-radius: 999px;
        background: #7c3aed;
        color: #fff;
        padding: 5px 9px;
        font: 700 11px/1 -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      }
    `;
    document.head.appendChild(style);
  }

  function ensureActionStyles() {
    if (document.getElementById("dynara-action-styles")) return;
    const style = document.createElement("style");
    style.id = "dynara-action-styles";
    style.textContent = `
      html.dynara-reading-large main,
      body.dynara-reading-large main {
        font-size: 18px !important;
        line-height: 1.85 !important;
      }

      html.dynara-reading-large main p,
      html.dynara-reading-large main li,
      html.dynara-reading-large main input,
      html.dynara-reading-large main textarea,
      html.dynara-reading-large main button,
      html.dynara-reading-large main a,
      body.dynara-reading-large main p,
      body.dynara-reading-large main li,
      body.dynara-reading-large main input,
      body.dynara-reading-large main textarea,
      body.dynara-reading-large main button,
      body.dynara-reading-large main a {
        font-size: 1.12em !important;
        line-height: 1.85 !important;
      }

      html.dynara-reading-large main h1,
      body.dynara-reading-large main h1 {
        font-size: clamp(2.5rem, 8vw, 5.5rem) !important;
      }

      html.dynara-reading-large main h2,
      body.dynara-reading-large main h2 {
        font-size: clamp(2rem, 5vw, 3.5rem) !important;
      }

      html.dynara-reading-width main,
      body.dynara-reading-width main {
        max-width: 820px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 24px !important;
        padding-right: 24px !important;
      }

      html.dynara-reading-width main section,
      html.dynara-reading-width main .container,
      body.dynara-reading-width main section,
      body.dynara-reading-width main .container {
        max-width: 820px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      html.dynara-high-contrast,
      body.dynara-high-contrast {
        background: #ffffff !important;
        filter: contrast(1.22) saturate(0.86) !important;
      }

      html.dynara-high-contrast main,
      html.dynara-high-contrast main *,
      body.dynara-high-contrast main,
      body.dynara-high-contrast main * {
        color: #020617 !important;
        text-shadow: none !important;
      }

      html.dynara-density-compact main section,
      body.dynara-density-compact main section {
        padding-top: 1.5rem !important;
        padding-bottom: 1.5rem !important;
      }

      html.dynara-density-spacious main section,
      body.dynara-density-spacious main section {
        padding-top: 5rem !important;
        padding-bottom: 5rem !important;
      }

      html.dynara-profile-active main,
      body.dynara-profile-active main {
        font-size: calc(16px * var(--dynara-font-scale, 1)) !important;
      }

	      html.dynara-motion-reduced *,
	      body.dynara-motion-reduced * {
	        animation-duration: 0.001ms !important;
	        animation-iteration-count: 1 !important;
	        transition-duration: 0.001ms !important;
	        scroll-behavior: auto !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"],
	      body.dynara-hero-showcase [data-dynara-panel="hero"] {
	        min-height: min(760px, 86vh) !important;
	        display: grid !important;
	        align-items: center !important;
	        overflow: hidden !important;
	        background:
	          radial-gradient(circle at 18% 18%, rgba(244, 114, 182, 0.28), transparent 30%),
	          radial-gradient(circle at 82% 24%, rgba(20, 184, 166, 0.24), transparent 32%),
	          linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%) !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"] > .container,
	      body.dynara-hero-showcase [data-dynara-panel="hero"] > .container {
	        padding-top: clamp(5rem, 11vh, 8rem) !important;
	        padding-bottom: clamp(4rem, 9vh, 7rem) !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"] h1,
	      body.dynara-hero-showcase [data-dynara-panel="hero"] h1 {
	        max-width: 980px !important;
	        font-size: clamp(3.75rem, 10vw, 8.5rem) !important;
	        line-height: 0.96 !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero-search"],
	      body.dynara-hero-showcase [data-dynara-panel="hero-search"] {
	        max-width: 680px !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="tool-categories"],
	      body.dynara-hero-showcase [data-dynara-panel="tool-categories"] {
	        padding-top: 3rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] > .container,
	      body.dynara-hero-compact [data-dynara-panel="hero"] > .container {
	        padding-top: 2.5rem !important;
	        padding-bottom: 2rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] h1,
	      body.dynara-hero-compact [data-dynara-panel="hero"] h1 {
	        font-size: clamp(2.75rem, 7vw, 5.5rem) !important;
	        line-height: 1 !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] p,
	      body.dynara-hero-compact [data-dynara-panel="hero"] p {
	        margin-top: 0.75rem !important;
	        font-size: 1rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero-search"],
	      body.dynara-hero-compact [data-dynara-panel="hero-search"] {
	        margin-top: 1.25rem !important;
	        max-width: 520px !important;
	      }

	      html.dynara-hero-clean [data-dynara-panel="hero"] > .pointer-events-none,
	      html.dynara-hero-clean [data-dynara-panel="hero"] > svg,
	      html.dynara-hero-clean [data-dynara-panel="hero"] > span,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > .pointer-events-none,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > svg,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > span {
	        display: none !important;
	      }

	      html.dynara-hero-clean [data-dynara-panel="hero"],
	      body.dynara-hero-clean [data-dynara-panel="hero"] {
	        background: hsl(var(--background)) !important;
	      }
	    `;
    document.head.appendChild(style);
  }

  function togglePageClass(className: string) {
    const isActive = document.documentElement.classList.toggle(className);
    document.body.classList.toggle(className, isActive);
    if (isActive) activeActionClasses.add(className);
    else activeActionClasses.delete(className);
    console.info("[Dynara content] toggled page class", {
      className,
      isActive,
      htmlClassName: document.documentElement.className,
      bodyClassName: document.body.className
    });
  }

  function removePageClasses(classNames: string[]) {
    for (const className of classNames) {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
      activeActionClasses.delete(className);
    }
  }

  function applyTokenOverrides(tokenOverrides: Record<string, string> = {}) {
    currentTokenOverrides = { ...currentTokenOverrides, ...tokenOverrides };
    for (const [tokenId, value] of Object.entries(tokenOverrides)) {
      const variable = TOKEN_CSS_VARIABLES[tokenId];
      if (variable) document.documentElement.style.setProperty(variable, value);
    }
  }

  function resetTokenOverrides() {
    currentTokenOverrides = {};
    for (const variable of Object.values(TOKEN_CSS_VARIABLES)) {
      document.documentElement.style.removeProperty(variable);
    }
  }

  function applyProfileRuntime(profile?: UserInterfaceProfile) {
    ensureActionStyles();
    resetTokenOverrides();
    removePageClasses([
      "dynara-density-compact",
      "dynara-density-comfortable",
      "dynara-density-spacious",
      "dynara-motion-reduced",
      "dynara-profile-active"
    ]);

    if (!profile) return;

    activeProfileId = profile.id;
    activeViewId = null;
    document.documentElement.classList.add("dynara-profile-active", `dynara-density-${profile.density}`);
    document.body.classList.add("dynara-profile-active", `dynara-density-${profile.density}`);
    document.documentElement.style.setProperty("--dynara-font-scale", String(profile.accessibility.fontScale ?? 1));

    if (profile.accessibility.motion === "reduced") {
      document.documentElement.classList.add("dynara-motion-reduced");
      document.body.classList.add("dynara-motion-reduced");
    }

    applyTokenOverrides(profile.tokenOverrides);
    console.info("[Dynara content] applied profile runtime", {
      profileId: profile.id,
      density: profile.density,
      accessibility: profile.accessibility,
      tokenOverrides: profile.tokenOverrides
    });
  }

  function applyBuiltInAction(actionId: string) {
    ensureActionStyles();
    console.info("[Dynara content] apply built-in action", { actionId });

    const now = Date.now();
    const lastActionId = document.documentElement.dataset.dynaraLastActionId;
    const lastActionAt = Number(document.documentElement.dataset.dynaraLastActionAt ?? 0);
    if (lastActionId === actionId && now - lastActionAt < 300) {
      console.info("[Dynara content] ignored duplicate action", { actionId, elapsedMs: now - lastActionAt });
      return false;
    }
    document.documentElement.dataset.dynaraLastActionId = actionId;
    document.documentElement.dataset.dynaraLastActionAt = String(now);

    if (actionId === "reading-large-text") {
      togglePageClass("dynara-reading-large");
      return true;
    }

    if (actionId === "reading-width") {
      togglePageClass("dynara-reading-width");
      return true;
    }

    if (actionId === "high-contrast") {
      togglePageClass("dynara-high-contrast");
      return true;
    }

	    if (actionId === "reset-reading") {
	      removePageClasses(["dynara-reading-large", "dynara-reading-width", "dynara-high-contrast"]);
	      return true;
	    }

	    if (actionId === "hero-showcase") {
	      removePageClasses(["dynara-hero-compact", "dynara-hero-clean"]);
	      togglePageClass("dynara-hero-showcase");
	      return true;
	    }

	    if (actionId === "hero-compact") {
	      removePageClasses(["dynara-hero-showcase"]);
	      togglePageClass("dynara-hero-compact");
	      return true;
	    }

	    if (actionId === "hero-clean") {
	      togglePageClass("dynara-hero-clean");
	      return true;
	    }

	    if (actionId === "hero-reset") {
	      removePageClasses(HERO_ACTION_CLASSES);
	      return true;
	    }

    if (actionId in THEME_OVERRIDES) {
      resetTokenOverrides();
      applyTokenOverrides(THEME_OVERRIDES[actionId]);
      return true;
    }

    if (actionId === "reset-interface") {
      resetTokenOverrides();
      resetAllSurfaceStyles();
      activeProfileId = null;
      activeViewId = null;
      document.documentElement.style.removeProperty("--dynara-font-scale");
	      removePageClasses([
	        "dynara-reading-large",
	        "dynara-reading-width",
	        "dynara-high-contrast",
	        ...HERO_ACTION_CLASSES,
	        "dynara-density-compact",
        "dynara-density-comfortable",
        "dynara-density-spacious",
        "dynara-motion-reduced",
        "dynara-profile-active"
      ]);
      return true;
    }

    return false;
  }

  function storageKey(manifest: DynaraManifest) {
    return `dynara:state:${manifest.appId || manifest.name}:${window.location.origin}`;
  }

  function storageGet<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (items) => resolve((items[key] as T | undefined) ?? null));
    });
  }

  function storageSet(key: string, value: unknown): Promise<void> {
    return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, () => resolve()));
  }

  function storageRemove(key: string): Promise<void> {
    return new Promise((resolve) => chrome.storage.local.remove(key, () => resolve()));
  }

	  type PersistedState = {
	    autoApply: boolean;
	    hiddenPanelIds: string[];
	    activeProfileId: string | null;
	    activeViewId: string | null;
	    actionClasses: string[];
	    tokenOverrides: Record<string, string>;
	    surfaceStyles?: Record<string, SurfaceStyle>;
	    savedAt: string;
	  };

  function snapshotState(autoApply: boolean): PersistedState {
    return {
      autoApply,
      hiddenPanelIds: [...hidden],
	      activeProfileId,
	      activeViewId,
	      actionClasses: [...activeActionClasses],
	      tokenOverrides: currentTokenOverrides,
	      surfaceStyles,
	      savedAt: new Date().toISOString()
	    };
	  }

  async function getPersistedState(manifest: DynaraManifest) {
    return await storageGet<PersistedState>(storageKey(manifest));
  }

  async function saveCurrentState(autoApply = true) {
    const manifest = await getManifest();
    const state = snapshotState(autoApply);
    await storageSet(storageKey(manifest), state);
    console.info("[Dynara content] saved state", state);
    return state;
  }

  async function setAutoApply(autoApply: boolean) {
    const manifest = await getManifest();
    const existing = await getPersistedState(manifest);
    const state = { ...(existing ?? snapshotState(autoApply)), autoApply, savedAt: new Date().toISOString() };
    await storageSet(storageKey(manifest), state);
    return state;
  }

  async function clearSavedState() {
    const manifest = await getManifest();
    await storageRemove(storageKey(manifest));
    return { autoApply: false };
  }

  function applyActionClasses(classNames: string[]) {
    ensureActionStyles();
    for (const className of classNames) {
      document.documentElement.classList.add(className);
      document.body.classList.add(className);
      activeActionClasses.add(className);
    }
  }

  function applyPanelVisibility(panels: { id: string; selector: string }[], visibleIds: string[]) {
    for (const panel of panels) {
      if (visibleIds.includes(panel.id)) applyShow(panel.id);
      else applyHide(panel.id, panel.selector);
    }
  }

  function styleElementId(panelId: string) {
    return `dynara-style-${CSS.escape(panelId)}`;
  }

  function surfaceStyleCss(selector: string, style: SurfaceStyle) {
    const rules: string[] = [];
    const childRules: string[] = [];

    if (style.background) rules.push(`background: ${style.background} !important`);
    if (style.color) {
      rules.push(`color: ${style.color} !important`);
      childRules.push(`color: inherit !important`);
    }
    if (style.spacing === "compact") rules.push("padding-top: 1.25rem !important", "padding-bottom: 1.25rem !important");
    if (style.spacing === "spacious") rules.push("padding-top: 5rem !important", "padding-bottom: 5rem !important");
    if (style.radius === "none") rules.push("border-radius: 0 !important");
    if (style.radius === "soft") rules.push("border-radius: 12px !important");
    if (style.radius === "round") rules.push("border-radius: 28px !important");
    if (style.fontScale === "small") rules.push("font-size: 0.94em !important");
    if (style.fontScale === "large") rules.push("font-size: 1.12em !important");

    if (rules.length === 0 && childRules.length === 0) return "";
    return [
      `${selector} { ${rules.join("; ")}; }`,
      childRules.length > 0 ? `${selector} * { ${childRules.join("; ")}; }` : ""
    ].filter(Boolean).join("\n");
  }

  function applySurfaceStyle(panelId: string, style: SurfaceStyle) {
    const manifest = activeManifest;
    const panel = manifest?.panels.find((item) => item.id === panelId);
    if (!panel) return false;

    const cleanStyle = Object.fromEntries(
      Object.entries(style).filter(([, value]) => value && value !== "normal")
    ) as SurfaceStyle;
    surfaceStyles = { ...surfaceStyles, [panelId]: cleanStyle };

    const css = surfaceStyleCss(panel.selector, cleanStyle);
    document.getElementById(styleElementId(panelId))?.remove();
    if (css) {
      const styleEl = document.createElement("style");
      styleEl.id = styleElementId(panelId);
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    console.info("[Dynara content] applied surface style", { panelId, style: cleanStyle });
    return true;
  }

  function resetSurfaceStyle(panelId: string) {
    document.getElementById(styleElementId(panelId))?.remove();
    const next = { ...surfaceStyles };
    delete next[panelId];
    surfaceStyles = next;
    return true;
  }

  function applySurfaceStyles(styles: Record<string, SurfaceStyle>) {
    for (const [panelId, style] of Object.entries(styles)) {
      applySurfaceStyle(panelId, style);
    }
  }

  function resetAllSurfaceStyles() {
    for (const panelId of Object.keys(surfaceStyles)) {
      document.getElementById(styleElementId(panelId))?.remove();
    }
    surfaceStyles = {};
  }

  function getWysiwygState() {
    return {
      inspectMode,
      hoveredSurface,
      selectedSurface,
      surfaceStyles
    };
  }

  function ensureInspectOverlay() {
    ensureInspectorStyles();
    let overlay = document.getElementById("dynara-inspect-overlay") as HTMLDivElement | null;
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "dynara-inspect-overlay";
    overlay.className = "dynara-inspect-overlay";
    overlay.style.display = "none";
    const label = document.createElement("div");
    label.className = "dynara-inspect-label";
    overlay.appendChild(label);
    document.body.appendChild(overlay);
    return overlay;
  }

  function updateInspectOverlay(surface: SelectedSurface | null, element?: Element | null) {
    const overlay = ensureInspectOverlay();
    const target = element ?? (surface ? document.querySelector(surface.selector) : null);
    if (!surface || !target) {
      overlay.style.display = "none";
      return;
    }

    const rect = target.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.top = `${Math.max(0, rect.top)}px`;
    overlay.style.left = `${Math.max(0, rect.left)}px`;
    overlay.style.width = `${Math.max(0, rect.width)}px`;
    overlay.style.height = `${Math.max(0, rect.height)}px`;
    const label = overlay.querySelector<HTMLElement>(".dynara-inspect-label");
    if (label) label.textContent = surface.label;
  }

  function surfaceFromElement(element: Element | null, manifest: DynaraManifest): { surface: SelectedSurface; element: Element } | null {
    if (!element) return null;

    for (const panel of manifest.panels) {
      const direct = element.matches(panel.selector) ? element : element.closest(panel.selector);
      if (direct) return { surface: { id: panel.id, label: panel.label, selector: panel.selector }, element: direct };
    }

    return null;
  }

  function onInspectMove(event: MouseEvent) {
    if (!inspectMode || !activeManifest) return;
    const match = surfaceFromElement(event.target as Element | null, activeManifest);
    hoveredSurface = match?.surface ?? null;
    updateInspectOverlay(hoveredSurface, match?.element);
  }

  function onInspectClick(event: MouseEvent) {
    if (!inspectMode || !activeManifest) return;
    const match = surfaceFromElement(event.target as Element | null, activeManifest);
    if (!match) return;

    event.preventDefault();
    event.stopPropagation();
    selectedSurface = match.surface;
    hoveredSurface = match.surface;
    updateInspectOverlay(selectedSurface, match.element);
    setInspectMode(false);
    chrome.runtime.sendMessage({ type: "WYSIWYG_SELECTED", selectedSurface, surfaceStyles });
  }

  function setInspectMode(enabled: boolean) {
    inspectMode = enabled;
    ensureInspectOverlay();

    if (enabled) {
      document.addEventListener("mousemove", onInspectMove, true);
      document.addEventListener("click", onInspectClick, true);
      document.documentElement.style.cursor = "crosshair";
    } else {
      document.removeEventListener("mousemove", onInspectMove, true);
      document.removeEventListener("click", onInspectClick, true);
      document.documentElement.style.cursor = "";
      updateInspectOverlay(selectedSurface);
    }

    console.info("[Dynara content] inspect mode", { enabled });
  }

  async function applyInterfacePlan(plan: InterfacePlan) {
    const manifest = await getManifest();
    const allowedPanelIds = new Set(manifest.panels.map((panel) => panel.id));
    const allowedActionIds = new Set(manifest.actions.map((action) => action.id));
    const allowedTokenIds = new Set(manifest.designSystem.tokens.filter((token) => token.mutable).map((token) => token.id));
    const profile = plan.profileId ? manifest.profiles.find((item) => item.id === plan.profileId) : undefined;
    const view = plan.viewId ? manifest.views.find((item) => item.id === plan.viewId) : undefined;

    if (profile) {
      applyPanelVisibility(manifest.panels, profile.visibleSurfaces.filter((id) => allowedPanelIds.has(id)));
      applyProfileRuntime(profile);
    } else if (view) {
      applyPanelVisibility(manifest.panels, view.panels.filter((id) => allowedPanelIds.has(id)));
      activeViewId = view.id;
      activeProfileId = null;
    } else if (plan.visibleSurfaces?.length) {
      applyPanelVisibility(manifest.panels, plan.visibleSurfaces.filter((id) => allowedPanelIds.has(id)));
      activeViewId = null;
      activeProfileId = null;
    }

	    const safeTokenOverrides = Object.fromEntries(
	      Object.entries(plan.tokenOverrides ?? {}).filter(([tokenId]) => allowedTokenIds.has(tokenId))
	    );
	    const contrastResults = auditManifestContrast(manifest, {
	      ...(profile?.tokenOverrides ?? {}),
	      ...safeTokenOverrides
	    });
	    const contrastIssues = failingContrast(contrastResults);
	    if (contrastIssues.length > 0) {
	      console.warn("[Dynara content] contrast issues in interface plan", contrastIssues);
	    }
	    applyTokenOverrides(safeTokenOverrides);

    const actionResults = [];
    for (const actionId of plan.actionIds ?? []) {
      if (!allowedActionIds.has(actionId)) continue;
      actionResults.push({ actionId, handled: applyBuiltInAction(actionId) });
    }

    let savedState: PersistedState | null = null;
    if (plan.save) savedState = await saveCurrentState(true);

    const result = {
      ok: true,
      applied: {
        profileId: profile?.id ?? null,
        viewId: view?.id ?? null,
	        tokenOverrides: safeTokenOverrides,
	        contrastIssues: contrastIssues.map((issue) => ({
	          label: issue.label,
	          ratio: issue.ratio,
	          foregroundToken: issue.foregroundToken,
	          backgroundToken: issue.backgroundToken
	        })),
	        actionResults,
        saved: Boolean(savedState)
      },
      state: savedState
    };
    console.info("[Dynara content] applied interface plan", { plan, result });
    return result;
  }

  async function applySavedStateIfEnabled(manifest: DynaraManifest) {
    const state = await getPersistedState(manifest);
    if (!state?.autoApply) return;

    const profile = state.activeProfileId ? manifest.profiles.find((item) => item.id === state.activeProfileId) : undefined;
    const view = state.activeViewId ? manifest.views.find((item) => item.id === state.activeViewId) : undefined;

    if (profile) {
      applyPanelVisibility(manifest.panels, profile.visibleSurfaces);
      applyProfileRuntime(profile);
    } else if (view) {
      applyPanelVisibility(manifest.panels, view.panels);
      activeViewId = view.id;
    } else {
      for (const panel of manifest.panels) {
        state.hiddenPanelIds.includes(panel.id) ? applyHide(panel.id, panel.selector) : applyShow(panel.id);
      }
    }

	    applyTokenOverrides(state.tokenOverrides);
	    applySurfaceStyles(state.surfaceStyles ?? {});
	    applyActionClasses(state.actionClasses);
	    console.info("[Dynara content] auto-applied saved state", state);
	  }

  function getActionDebug(actionId: string, handled: boolean) {
    const main = document.querySelector("main");
    const mainStyle = main ? getComputedStyle(main) : null;

    return {
      actionId,
      handled,
      url: window.location.href,
      hasMain: Boolean(main),
      hasActionStyles: Boolean(document.getElementById("dynara-action-styles")),
      htmlClassName: document.documentElement.className,
      bodyClassName: document.body.className,
      mainFontSize: mainStyle?.fontSize ?? null,
      mainLineHeight: mainStyle?.lineHeight ?? null,
      mainMaxWidth: mainStyle?.maxWidth ?? null,
      mainWidth: main ? Math.round(main.getBoundingClientRect().width) : null
    };
  }

  // ── Manifest discovery ──────────────────────────────────────────────────
  // 1. Ask the page (postMessage) — covers both Dynara.init({...}) inline
  //    manifests and SDK-side fetches of /.well-known/dynara.json.
  // 2. Fall back to fetching /.well-known/dynara.json ourselves.
  // 3. Fall back to auto-discovering [data-dynara-panel] elements.
  // 4. Fall back to the empty default manifest.

  function requestManifestFromPage(): Promise<DynaraManifest | null> {
    return new Promise((resolve) => {
      const onMessage = (event: MessageEvent) => {
        if (event.source !== window) return;
        const data = event.data as { source?: string; type?: string; manifest?: unknown };
        if (data?.source !== "dynara-page" || data?.type !== "DYNARA_MANIFEST_RESPONSE") return;
        window.removeEventListener("message", onMessage);
        clearTimeout(timer);
        resolve(normalizeManifest(data.manifest as Partial<DynaraManifest>, "sdk"));
      };
      window.addEventListener("message", onMessage);
      window.postMessage({ source: "dynara-extension", type: "DYNARA_REQUEST_MANIFEST" }, "*");
      const timer = setTimeout(() => {
        window.removeEventListener("message", onMessage);
        resolve(null);
      }, 400);
    });
  }

  async function fetchWellKnown(): Promise<DynaraManifest | null> {
    try {
      const res = await fetch("/.well-known/dynara.json", { credentials: "same-origin" });
      if (!res.ok) return null;
      const json = await res.json();
      return normalizeManifest(json, "well-known");
    } catch {
      return null;
    }
  }

  function autoDiscover(): DynaraManifest | null {
    const els = document.querySelectorAll<HTMLElement>("[data-dynara-panel]");
    if (els.length === 0) return null;
    const panels = Array.from(els).map((el) => {
      const id = el.getAttribute("data-dynara-panel")!;
      const label = el.getAttribute("data-dynara-label") || id;
      return { id, label, selector: `[data-dynara-panel="${id}"]` };
    });
    return normalizeManifest({ name: document.title || window.location.hostname, panels }, "auto-discovery");
  }

  async function discoverManifest(): Promise<DynaraManifest> {
    const fromPage = await requestManifestFromPage();
    if (fromPage) return fromPage;
    const fromWellKnown = await fetchWellKnown();
    if (fromWellKnown) return fromWellKnown;
    const discovered = autoDiscover();
    if (discovered) return discovered;
    return DEFAULT_MANIFEST;
  }

	  function getManifest(): Promise<DynaraManifest> {
	    if (!manifestPromise) {
	      manifestPromise = discoverManifest().then((manifest) => {
	        activeManifest = manifest;
	        return manifest;
	      });
	    }
	    return manifestPromise;
	  }

  // Kick off discovery early so it's usually cached by the time the side panel asks.
  void getManifest().then(applySavedStateIfEnabled);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.info("[Dynara content] received message", msg);

    if (msg.type === "PING") {
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === "GET_STATE") {
      sendResponse({ hidden: [...hidden] });
      return;
    }

    if (msg.type === "GET_MANIFEST") {
      getManifest().then((manifest) => sendResponse({ manifest }));
      return true;
    }

    if (msg.type === "TOGGLE_PANEL") {
      const { panelId, selector } = msg as { panelId: string; selector: string };
      if (hidden.has(panelId)) applyShow(panelId);
      else applyHide(panelId, selector);
      sendResponse({ hidden: [...hidden] });
      return;
    }

    if (msg.type === "APPLY_VIEW") {
      const { panels, visiblePanelIds } = msg as { panels: { id: string; selector: string }[]; visiblePanelIds: string[] };
      activeViewId = (msg as { viewId?: string }).viewId ?? null;
      activeProfileId = null;
      applyPanelVisibility(panels, visiblePanelIds);
      sendResponse({ hidden: [...hidden] });
      return;
    }

    if (msg.type === "APPLY_PROFILE") {
      const { panels, visiblePanelIds, profile } = msg as { panels: { id: string; selector: string }[]; visiblePanelIds: string[]; profile?: UserInterfaceProfile };
      for (const panel of panels) {
        if (visiblePanelIds.includes(panel.id)) applyShow(panel.id);
        else applyHide(panel.id, panel.selector);
      }
      applyProfileRuntime(profile);
      sendResponse({ hidden: [...hidden] });
      return;
    }

    if (msg.type === "TRIGGER_ACTION") {
      const { actionId } = msg as { actionId: string };
      const handled = applyBuiltInAction(actionId);
      const debug = getActionDebug(actionId, handled);
      console.info("[Dynara content] action result", debug);
      window.postMessage({ source: "dynara-extension", type: "DYNARA_TRIGGER_ACTION", actionId }, "*");
      sendResponse({ ok: true, debug });
      return;
    }

    if (msg.type === "GET_PERSISTENCE") {
      getManifest().then((manifest) => getPersistedState(manifest)).then((state) => sendResponse({ state }));
      return true;
    }

    if (msg.type === "SAVE_CURRENT_STATE") {
      saveCurrentState(true).then((state) => sendResponse({ ok: true, state }));
      return true;
    }

    if (msg.type === "SET_AUTO_APPLY") {
      const { autoApply } = msg as { autoApply: boolean };
      setAutoApply(autoApply).then((state) => sendResponse({ ok: true, state }));
      return true;
    }

    if (msg.type === "CLEAR_SAVED_STATE") {
      clearSavedState().then((state) => sendResponse({ ok: true, state }));
      return true;
    }

	    if (msg.type === "APPLY_INTERFACE_PLAN") {
	      const { plan } = msg as { plan: InterfacePlan };
	      applyInterfacePlan(plan).then((result) => sendResponse(result));
	      return true;
	    }

	    if (msg.type === "SET_INSPECT_MODE") {
	      const { enabled } = msg as { enabled: boolean };
	      getManifest().then(() => {
	        setInspectMode(enabled);
	        sendResponse({ ok: true, ...getWysiwygState() });
	      });
	      return true;
	    }

	    if (msg.type === "GET_WYSIWYG_STATE") {
	      sendResponse(getWysiwygState());
	      return;
	    }

	    if (msg.type === "APPLY_SURFACE_STYLE") {
	      const { panelId, style } = msg as { panelId: string; style: SurfaceStyle };
	      getManifest().then(() => {
	        const ok = applySurfaceStyle(panelId, style);
	        sendResponse({ ok, ...getWysiwygState() });
	      });
	      return true;
	    }

	    if (msg.type === "RESET_SURFACE_STYLE") {
	      const { panelId } = msg as { panelId: string };
	      resetSurfaceStyle(panelId);
	      sendResponse({ ok: true, ...getWysiwygState() });
	      return;
	    }
	  });
	}
