// Content script — discovers the page's Dynara manifest and applies panel/view
// toggles + action triggers in response to messages from the side panel.
// No React UI here; all UI lives in the native Chrome Side Panel.

import { normalizeManifest, DEFAULT_MANIFEST, type DynaraManifest } from "../shared/manifest";

if (window === window.top && window.location.protocol.startsWith("http") && document.documentElement) {
  const hidden = new Set<string>();
  let manifestPromise: Promise<DynaraManifest> | null = null;

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
    if (!manifestPromise) manifestPromise = discoverManifest();
    return manifestPromise;
  }

  // Kick off discovery early so it's usually cached by the time the side panel asks.
  void getManifest();

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
      for (const panel of panels) {
        if (visiblePanelIds.includes(panel.id)) applyShow(panel.id);
        else applyHide(panel.id, panel.selector);
      }
      sendResponse({ hidden: [...hidden] });
      return;
    }

    if (msg.type === "TRIGGER_ACTION") {
      const { actionId } = msg as { actionId: string };
      window.postMessage({ source: "dynara-extension", type: "DYNARA_TRIGGER_ACTION", actionId }, "*");
      sendResponse({ ok: true });
      return;
    }
  });
}
