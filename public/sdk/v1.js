// Dynara SDK v1 — add this script tag to any page to make it customizable
// from the Dynara browser extension:
//
//   <script src="https://dynara.io/sdk/v1.js"></script>
//
// Then either let the extension auto-discover [data-dynara-panel] elements
// and /.well-known/dynara.json, or declare a manifest explicitly:
//
//   Dynara.init({
//     name: "My App",
//     color: "#6366f1",
//     panels: [{ id: "stats", label: "Statistics", selector: "[data-dynara-panel='stats']" }],
//     views: [{ id: "focus", label: "Focus mode", panels: ["stats"] }],
//     actions: [{ id: "refresh", label: "Refresh data" }]
//   });
//   Dynara.action("refresh", () => { /* run real app logic */ });
(function () {
  if (window.Dynara) return;

  var manifest = null;
  var actions = {};

  function normalize(raw) {
    var panels = (raw && raw.panels) || [];
    var surfaces = (raw && raw.surfaces) || panels.map(function (panel) {
      return {
        id: panel.id,
        label: panel.label,
        type: "panel",
        selector: panel.selector,
        side: panel.side,
        required: false,
        hideable: true,
        movable: false,
        resizable: false
      };
    });

    return {
      appId: raw && raw.appId,
      name: (raw && raw.name) || document.title || location.hostname,
      version: raw && raw.version,
      color: (raw && raw.color) || "#7c3aed",
      panels: panels,
      surfaces: surfaces,
      views: (raw && raw.views) || [],
      actions: (raw && raw.actions) || [],
      designSystem: (raw && raw.designSystem) || { source: "manual", version: "1.0.0", tokens: [], componentRefs: [] },
      constraints: (raw && raw.constraints) || [],
      profiles: (raw && raw.profiles) || [],
      contentBlocks: (raw && raw.contentBlocks) || [],
      editKeyHash: raw && raw.editKeyHash,
      logoUrl: raw && raw.logoUrl,
      widgetEnabled: Boolean(raw && raw.widgetEnabled),
      widgetPosition: (raw && raw.widgetPosition) || "bottom-right"
    };
  }

  function fetchWellKnown() {
    return fetch("/.well-known/dynara.json", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function applyContentBlocks(m) {
    var blocks = (m && m.contentBlocks) || [];
    blocks.forEach(function (block) {
      if (!block || !block.selector) return;
      var el = document.querySelector(block.selector);
      if (!el) return;
      if (block.type === "text") {
        el.textContent = block.value || "";
      }
      if (block.type === "image" && el instanceof HTMLImageElement) {
        el.src = block.value || "";
      }
    });
  }

  function applyContentBlocksWhenReady(m) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { applyContentBlocks(m); }, { once: true });
      return;
    }
    applyContentBlocks(m);
  }

  function ensureManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetchWellKnown().then(function (json) {
      manifest = normalize(json);
      applyContentBlocksWhenReady(manifest);
      renderWidgetWhenReady(manifest);
      return manifest;
    });
  }

  // ── On-page widget — a branded bubble -> panel that lets end-users switch
  // between declared themes (profiles) and views, with no browser extension.
  // Deliberately scoped to themes + views only: content editing and surface
  // toggling stay extension-only, so a random site visitor can't reach them.

  var TOKEN_CSS_VARIABLES = {
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

  function widgetStorageKey(m) {
    return "dynara-widget:" + (m.appId || m.name) + ":" + location.origin;
  }

  function applyTokenOverrides(overrides) {
    Object.keys(overrides || {}).forEach(function (tokenId) {
      var variable = TOKEN_CSS_VARIABLES[tokenId];
      if (variable) document.documentElement.style.setProperty(variable, overrides[tokenId]);
    });
  }

  function applyPanelVisibility(m, visibleIds) {
    var style = document.getElementById("dynara-widget-visibility");
    if (!style) {
      style = document.createElement("style");
      style.id = "dynara-widget-visibility";
      document.head.appendChild(style);
    }
    var rules = (m.panels || [])
      .filter(function (panel) { return visibleIds.indexOf(panel.id) === -1; })
      .map(function (panel) { return panel.selector + " { display: none !important; }"; });
    style.textContent = rules.join("\n");
  }

  function applySelection(m, kind, id) {
    if (kind === "profile") {
      var profile = (m.profiles || []).filter(function (p) { return p.id === id; })[0];
      if (!profile) return;
      applyTokenOverrides(profile.tokenOverrides);
      if (profile.visibleSurfaces && profile.visibleSurfaces.length) applyPanelVisibility(m, profile.visibleSurfaces);
    } else if (kind === "view") {
      var view = (m.views || []).filter(function (v) { return v.id === id; })[0];
      if (!view) return;
      applyPanelVisibility(m, view.panels || []);
    }
    try {
      localStorage.setItem(widgetStorageKey(m), JSON.stringify({ kind: kind, id: id }));
    } catch (e) { /* storage unavailable — selection just won't persist */ }
  }

  function renderWidgetWhenReady(m) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { renderWidget(m); }, { once: true });
      return;
    }
    renderWidget(m);
  }

  function renderWidget(m) {
    if (!m.widgetEnabled) return;
    if (document.getElementById("dynara-widget-host")) return;
    var hasProfiles = (m.profiles || []).length > 0;
    var hasViews = (m.views || []).length > 0;
    if (!hasProfiles && !hasViews) return;

    var host = document.createElement("div");
    host.id = "dynara-widget-host";
    host.style.all = "initial";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

    var side = m.widgetPosition === "bottom-left" ? "left" : "right";
    var style = document.createElement("style");
    style.textContent =
      ":host{all:initial}" +
      "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif}" +
      ".dw-bubble{position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;width:52px;height:52px;" +
      "border-radius:9999px;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,.24);" +
      "display:grid;place-items:center;overflow:hidden;padding:0}" +
      ".dw-bubble img{width:100%;height:100%;object-fit:cover}" +
      ".dw-bubble span{color:#fff;font-weight:700;font-size:18px}" +
      ".dw-panel{position:fixed;bottom:82px;" + side + ":20px;z-index:2147483000;width:280px;max-height:70vh;" +
      "overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(15,23,42,.28);" +
      "border:1px solid #e2e8f0;display:none;padding:14px}" +
      ".dw-panel.dw-open{display:block}" +
      ".dw-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:#64748b;margin:10px 0 6px}" +
      ".dw-title:first-child{margin-top:0}" +
      ".dw-option{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:8px;border:1px solid #e2e8f0;" +
      "background:#fff;color:#0f172a;font-size:13px;font-weight:600;margin-bottom:6px;cursor:pointer}" +
      ".dw-option:hover{background:#f8fafc}" +
      ".dw-option.dw-active{border-color:#0f172a;background:#0f172a;color:#fff}";
    root.appendChild(style);

    var bubble = document.createElement("button");
    bubble.className = "dw-bubble";
    bubble.type = "button";
    bubble.style.background = m.color || "#7c3aed";
    bubble.setAttribute("aria-label", "Customize " + (m.name || "this page"));
    if (m.logoUrl) {
      var img = document.createElement("img");
      img.src = m.logoUrl;
      img.alt = "";
      bubble.appendChild(img);
    } else {
      var span = document.createElement("span");
      span.textContent = (m.name || "D").slice(0, 1).toUpperCase();
      bubble.appendChild(span);
    }

    var panel = document.createElement("div");
    panel.className = "dw-panel";

    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(widgetStorageKey(m)) || "null");
    } catch (e) { /* ignore */ }

    function addOptions(kind, items, title) {
      if (!items || !items.length) return;
      var heading = document.createElement("p");
      heading.className = "dw-title";
      heading.textContent = title;
      panel.appendChild(heading);

      items.forEach(function (item) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "dw-option" + (saved && saved.kind === kind && saved.id === item.id ? " dw-active" : "");
        button.textContent = item.label || item.id;
        button.addEventListener("click", function () {
          applySelection(m, kind, item.id);
          Array.prototype.forEach.call(panel.querySelectorAll(".dw-option"), function (el) {
            el.classList.remove("dw-active");
          });
          button.classList.add("dw-active");
        });
        panel.appendChild(button);
      });
    }

    addOptions("profile", m.profiles, "Themes");
    addOptions("view", m.views, "Views");

    bubble.addEventListener("click", function () {
      panel.classList.toggle("dw-open");
    });

    root.appendChild(panel);
    root.appendChild(bubble);

    if (saved) applySelection(m, saved.kind, saved.id);
  }

  window.Dynara = {
    init: function (m) {
      manifest = normalize(m);
      applyContentBlocksWhenReady(manifest);
      renderWidgetWhenReady(manifest);
    },
    action: function (id, fn) {
      actions[id] = fn;
    }
  };

  window.addEventListener("message", function (event) {
    if (event.source !== window || !event.data || event.data.source !== "dynara-extension") return;
    var msg = event.data;

    if (msg.type === "DYNARA_REQUEST_MANIFEST") {
      ensureManifest().then(function (m) {
        window.postMessage({ source: "dynara-page", type: "DYNARA_MANIFEST_RESPONSE", manifest: m }, "*");
      });
    }

    if (msg.type === "DYNARA_TRIGGER_ACTION") {
      var fn = actions[msg.actionId];
      if (typeof fn === "function") fn();
    }
  });
})();
