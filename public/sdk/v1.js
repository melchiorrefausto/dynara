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
    var closedTransform = side === "left" ? "translateX(-100%)" : "translateX(100%)";
    var brandColor = m.color || "#7c3aed";
    var style = document.createElement("style");
    style.textContent =
      ":host{all:initial}" +
      "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif}" +
      ".dw-bubble{position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;width:52px;height:52px;" +
      "border-radius:9999px;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,.24);" +
      "display:grid;place-items:center;overflow:hidden;padding:0;transition:opacity 150ms ease,transform 150ms ease}" +
      ".dw-bubble.dw-hidden{opacity:0;pointer-events:none;transform:scale(.85)}" +
      ".dw-bubble img{width:100%;height:100%;object-fit:cover}" +
      ".dw-bubble span{color:#fff;font-weight:700;font-size:18px}" +
      ".dw-sidebar{position:fixed;top:0;bottom:0;" + side + ":0;z-index:2147483000;width:340px;max-width:88vw;" +
      "background:#fff;box-shadow:0 0 40px rgba(15,23,42,.28);border-" + (side === "left" ? "right" : "left") + ":1px solid #e2e8f0;" +
      "display:flex;flex-direction:column;color:#0f172a;font-size:13px;" +
      "transform:" + closedTransform + ";transition:transform 220ms ease}" +
      ".dw-sidebar.dw-open{transform:translateX(0)}" +
      ".dw-header{padding:14px 16px 12px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-shrink:0}" +
      ".dw-header-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#7c3aed,#a855f7);" +
      "display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}" +
      ".dw-header-icon img{width:100%;height:100%;object-fit:cover}" +
      ".dw-header-icon span{color:#fff;font-size:13px;font-weight:800}" +
      ".dw-header-text{flex:1;min-width:0}" +
      ".dw-header-title{font-weight:700;font-size:14px}" +
      ".dw-header-sub{font-size:10px;color:#94a3b8}" +
      ".dw-header-badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:5px;flex-shrink:0}" +
      ".dw-close{border:none;background:transparent;cursor:pointer;color:#94a3b8;width:22px;height:22px;" +
      "border-radius:6px;display:grid;place-items:center;flex-shrink:0;font-size:16px;line-height:1;margin-left:2px}" +
      ".dw-close:hover{background:#f1f5f9;color:#0f172a}" +
      ".dw-detected{font-size:10px;color:#94a3b8;padding:10px 16px 0;margin:0}" +
      ".dw-body{flex:1;overflow-y:auto;padding:0 0 16px}" +
      ".dw-section{padding:14px 16px 0}" +
      ".dw-title{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px}" +
      ".dw-theme-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}" +
      ".dw-theme{min-height:62px;padding:8px;border-radius:8px;border:1px solid #e8edf5;background:#fff;" +
      "color:#334155;cursor:pointer;text-align:left}" +
      ".dw-theme.dw-active{background:#111827;border-color:#111827;color:#fff}" +
      ".dw-theme-swatches{display:flex;gap:3px;margin-bottom:7px}" +
      ".dw-theme-swatch{width:16px;height:16px;border-radius:9999px;border:1px solid rgba(15,23,42,.1)}" +
      ".dw-theme-label{display:block;font-size:11px;font-weight:800;line-height:1.1}" +
      ".dw-views{display:flex;flex-wrap:wrap;gap:6px}" +
      ".dw-view{background:#f1f5f9;color:#334155;border:none;border-radius:9999px;padding:6px 11px;" +
      "font-size:11px;font-weight:800;cursor:pointer}" +
      ".dw-view.dw-active{background:" + brandColor + ";color:#fff}" +
      ".dw-footer{padding:14px 16px;border-top:1px solid #f1f5f9;flex-shrink:0}" +
      ".dw-footer a{font-size:10px;color:#94a3b8;text-decoration:none}";
    root.appendChild(style);

    var bubble = document.createElement("button");
    bubble.className = "dw-bubble";
    bubble.type = "button";
    bubble.style.background = brandColor;
    bubble.setAttribute("aria-label", "Customize " + (m.name || "this page"));
    if (m.logoUrl) {
      var bubbleImg = document.createElement("img");
      bubbleImg.src = m.logoUrl;
      bubbleImg.alt = "";
      bubble.appendChild(bubbleImg);
    } else {
      var bubbleSpan = document.createElement("span");
      bubbleSpan.textContent = (m.name || "D").slice(0, 1).toUpperCase();
      bubble.appendChild(bubbleSpan);
    }

    var sidebar = document.createElement("div");
    sidebar.className = "dw-sidebar";

    var header = document.createElement("div");
    header.className = "dw-header";
    var headerIcon = document.createElement("div");
    headerIcon.className = "dw-header-icon";
    headerIcon.innerHTML = '<span>D</span>';
    var headerText = document.createElement("div");
    headerText.className = "dw-header-text";
    var headerTitle = document.createElement("div");
    headerTitle.className = "dw-header-title";
    headerTitle.textContent = "Dynara";
    var headerSub = document.createElement("div");
    headerSub.className = "dw-header-sub";
    headerSub.textContent = "Interface runtime";
    headerText.appendChild(headerTitle);
    headerText.appendChild(headerSub);
    var headerBadge = document.createElement("span");
    headerBadge.className = "dw-header-badge";
    headerBadge.style.background = brandColor + "22";
    headerBadge.style.color = brandColor;
    headerBadge.textContent = m.name || "App";
    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "dw-close";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.textContent = "×";
    header.appendChild(headerIcon);
    header.appendChild(headerText);
    header.appendChild(headerBadge);
    header.appendChild(closeButton);

    var detected = document.createElement("p");
    detected.className = "dw-detected";
    detected.textContent = "Detected via Dynara SDK";

    var body = document.createElement("div");
    body.className = "dw-body";

    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(widgetStorageKey(m)) || "null");
    } catch (e) { /* ignore */ }

    function tokenColor(overrides, key) {
      var value = overrides && overrides[key];
      return value ? "hsl(" + value + ")" : null;
    }

    function swatchesFor(profile) {
      var overrides = profile.tokenOverrides || {};
      var picks = [
        tokenColor(overrides, "color-primary"),
        tokenColor(overrides, "color-accent"),
        tokenColor(overrides, "color-background")
      ].filter(Boolean);
      return picks.length ? picks.slice(0, 3) : [brandColor];
    }

    if (m.profiles && m.profiles.length) {
      var themeSection = document.createElement("div");
      themeSection.className = "dw-section";
      var themeTitle = document.createElement("p");
      themeTitle.className = "dw-title";
      themeTitle.textContent = "Themes";
      var themeGrid = document.createElement("div");
      themeGrid.className = "dw-theme-grid";

      m.profiles.forEach(function (profile) {
        var card = document.createElement("button");
        card.type = "button";
        card.className = "dw-theme" + (saved && saved.kind === "profile" && saved.id === profile.id ? " dw-active" : "");
        if (profile.description) card.title = profile.description;

        var swatchRow = document.createElement("span");
        swatchRow.className = "dw-theme-swatches";
        swatchesFor(profile).forEach(function (color) {
          var dot = document.createElement("span");
          dot.className = "dw-theme-swatch";
          dot.style.background = color;
          swatchRow.appendChild(dot);
        });

        var label = document.createElement("span");
        label.className = "dw-theme-label";
        label.textContent = profile.label || profile.id;

        card.appendChild(swatchRow);
        card.appendChild(label);
        card.addEventListener("click", function () {
          applySelection(m, "profile", profile.id);
          Array.prototype.forEach.call(themeGrid.querySelectorAll(".dw-theme"), function (el) {
            el.classList.remove("dw-active");
          });
          card.classList.add("dw-active");
        });
        themeGrid.appendChild(card);
      });

      themeSection.appendChild(themeTitle);
      themeSection.appendChild(themeGrid);
      body.appendChild(themeSection);
    }

    if (m.views && m.views.length) {
      var viewSection = document.createElement("div");
      viewSection.className = "dw-section";
      var viewTitle = document.createElement("p");
      viewTitle.className = "dw-title";
      viewTitle.textContent = "Views";
      var viewList = document.createElement("div");
      viewList.className = "dw-views";

      m.views.forEach(function (view) {
        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "dw-view" + (saved && saved.kind === "view" && saved.id === view.id ? " dw-active" : "");
        pill.textContent = view.label || view.id;
        pill.addEventListener("click", function () {
          applySelection(m, "view", view.id);
          Array.prototype.forEach.call(viewList.querySelectorAll(".dw-view"), function (el) {
            el.classList.remove("dw-active");
          });
          pill.classList.add("dw-active");
        });
        viewList.appendChild(pill);
      });

      viewSection.appendChild(viewTitle);
      viewSection.appendChild(viewList);
      body.appendChild(viewSection);
    }

    function openSidebar() {
      sidebar.classList.add("dw-open");
      bubble.classList.add("dw-hidden");
    }

    function closeSidebar() {
      sidebar.classList.remove("dw-open");
      bubble.classList.remove("dw-hidden");
    }

    bubble.addEventListener("click", openSidebar);
    closeButton.addEventListener("click", closeSidebar);

    sidebar.appendChild(header);
    sidebar.appendChild(detected);
    sidebar.appendChild(body);
    root.appendChild(sidebar);
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

  // Auto-discover /.well-known/dynara.json for sites that never call
  // Dynara.init() explicitly (Level 2 integration). Deferred to
  // DOMContentLoaded so an inline Dynara.init() script tag right after this
  // one still wins the race and this becomes a no-op (ensureManifest already
  // short-circuits once `manifest` is set).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensureManifest(); }, { once: true });
  } else {
    ensureManifest();
  }
})();
