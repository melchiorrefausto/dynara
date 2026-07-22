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

  // Must be read synchronously during initial script execution — becomes
  // null once we're inside a promise/event handler.
  var scriptOrigin = (function () {
    try {
      return new URL(document.currentScript.src).origin;
    } catch (e) {
      return "https://dynara.io";
    }
  })();

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

  // ── Content editing — click-to-edit text/images, gated by editKeyHash.
  // Ported from the browser extension's content script so the site owner's
  // client can edit content through the widget too, no extension needed.

  var EDITABLE_TEXT_TAGS = { H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, P: 1, SPAN: 1, A: 1, BUTTON: 1, LI: 1, LABEL: 1 };

  async function sha256Hex(text) {
    var bytes = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.prototype.map.call(new Uint8Array(digest), function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function getSelectorForElement(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    var path = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      var selector = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function (s) { return s.tagName === node.tagName; });
        if (siblings.length > 1) selector += ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")";
      }
      path.unshift(selector);
      node = parent;
    }
    return path.length ? "body > " + path.join(" > ") : el.tagName.toLowerCase();
  }

  function isDirectTextElement(el) {
    if (!EDITABLE_TEXT_TAGS[el.tagName]) return false;
    var text = (el.textContent || "").trim();
    if (!text || text.length > 300) return false;
    return Array.prototype.some.call(el.childNodes, function (n) {
      return n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0;
    });
  }

  function resolveContentTarget(el) {
    if (!el) return null;
    if (el.tagName === "IMG") return el;
    var node = el;
    var depth = 0;
    while (node && depth < 4) {
      if (isDirectTextElement(node)) return node;
      node = node.parentElement;
      depth++;
    }
    return null;
  }

  function contentEditStorageKey(m) {
    return "dynara-content-blocks:" + (m.appId || m.name) + ":" + location.origin + location.pathname;
  }

  function loadStoredContentBlocks(m) {
    try {
      var raw = localStorage.getItem(contentEditStorageKey(m));
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveStoredContentBlocks(m, blocks) {
    try { localStorage.setItem(contentEditStorageKey(m), JSON.stringify(blocks)); } catch (e) { /* ignore */ }
  }

  function upsertStoredContentBlock(m, block) {
    var blocks = loadStoredContentBlocks(m);
    var index = -1;
    for (var i = 0; i < blocks.length; i++) { if (blocks[i].selector === block.selector) { index = i; break; } }
    if (index >= 0) blocks[index] = block; else blocks.push(block);
    saveStoredContentBlocks(m, blocks);
    return blocks;
  }

  function unlockStorageKey(m) {
    return "dynara-edit-unlocked:" + (m.appId || m.name) + ":" + location.origin;
  }

  function passwordStorageKey(m) {
    return "dynara-edit-password:" + (m.appId || m.name) + ":" + location.origin;
  }

  function isEditUnlocked(m) {
    try { return sessionStorage.getItem(unlockStorageKey(m)) === "1"; } catch (e) { return false; }
  }

  function getUnlockedPassword(m) {
    try { return sessionStorage.getItem(passwordStorageKey(m)); } catch (e) { return null; }
  }

  async function tryUnlock(m, password) {
    if (!m.editKeyHash) return false;
    var hash = await sha256Hex(password);
    if (hash !== m.editKeyHash) return false;
    try {
      sessionStorage.setItem(unlockStorageKey(m), "1");
      sessionStorage.setItem(passwordStorageKey(m), password);
    } catch (e) { /* ignore */ }
    return true;
  }

  async function submitContentEditDraft(m, blocks) {
    var password = getUnlockedPassword(m);
    if (!password) return { ok: false, error: "Unlock edit mode first." };
    if (!blocks.length) return { ok: false, error: "No edits to submit." };

    try {
      var res = await fetch(scriptOrigin + "/api/content-edit-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: m.appId || m.name,
          password: password,
          pageUrl: location.href,
          pagePath: location.pathname,
          blocks: blocks
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) return { ok: false, error: data.error || "Could not submit edits." };
      return { ok: true, draftId: data.draftId };
    } catch (e) {
      return { ok: false, error: "Could not reach Dynara backend." };
    }
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
    var hasEdit = Boolean(m.editKeyHash);
    if (!hasProfiles && !hasViews && !hasEdit) return;

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
      ".dw-footer a{font-size:10px;color:#94a3b8;text-decoration:none}" +
      ".dw-tabs{padding:12px 16px 0;flex-shrink:0}" +
      ".dw-tabs-track{display:flex;gap:2px;padding:3px;border-radius:10px;background:#f1f5f9}" +
      ".dw-tab{flex:1;padding:6px 0;border-radius:8px;border:none;font-size:11.5px;font-weight:700;cursor:pointer;" +
      "background:transparent;color:#64748b}" +
      ".dw-tab.dw-tab-active{background:#fff;color:" + brandColor + ";box-shadow:0 1px 3px rgba(15,23,42,.12)}" +
      ".dw-panel{display:none}" +
      ".dw-panel.dw-panel-active{display:flex;flex-direction:column;flex:1;min-height:0}" +
      ".dw-edit-note{font-size:12px;line-height:1.6;color:#64748b;margin:0 0 14px}" +
      ".dw-edit-card{border:1px solid #e8edf5;border-radius:10px;padding:14px;background:#f8fafc}" +
      ".dw-edit-card-title{margin:0;font-size:12.5px;font-weight:800;color:#0f172a}" +
      ".dw-edit-card-body{margin:4px 0 0;font-size:11.5px;color:#64748b;line-height:1.5}" +
      ".dw-edit-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:12px;" +
      "margin:10px 0 8px}" +
      ".dw-edit-btn{width:100%;padding:9px 0;border-radius:8px;border:none;font-size:12px;font-weight:800;" +
      "cursor:pointer;background:" + brandColor + ";color:#fff}" +
      ".dw-edit-btn:disabled{opacity:.5;cursor:not-allowed}" +
      ".dw-edit-btn-active{background:#16a34a}" +
      ".dw-edit-error{margin:8px 0 0;font-size:11px;color:#dc2626;font-weight:700}" +
      ".dw-edit-row{display:flex;gap:6px;margin-top:10px}" +
      ".dw-edit-secondary{flex:1;padding:8px 0;border-radius:8px;border:1px solid #e8edf5;background:#f8fafc;" +
      "color:#334155;font-size:11.5px;font-weight:700;cursor:pointer}" +
      ".dw-edit-submit{width:100%;margin-top:8px;padding:9px 0;border-radius:8px;border:1px solid #c4b5fd;" +
      "background:#f5f3ff;color:#6d28d9;font-size:11.5px;font-weight:800;cursor:pointer}" +
      ".dw-edit-submit:disabled{background:#f8fafc;color:#94a3b8;cursor:not-allowed;border-color:#e8edf5}" +
      ".dw-edit-feedback{margin:7px 0 0;font-size:11px;font-weight:700}" +
      ".dw-edit-list{display:grid;gap:6px;margin-top:16px}" +
      ".dw-edit-block{border:1px solid #e8edf5;border-radius:8px;padding:8px 10px}" +
      ".dw-edit-block-kind{font-size:10px;font-weight:800}" +
      ".dw-edit-block-value{margin:4px 0 0;font-size:11.5px;color:#334155;line-height:1.4;word-break:break-word}";
    root.appendChild(style);

    // Light-DOM styles for hover/editing outlines on the host page itself —
    // these must live outside the shadow root since they target page content.
    if (!document.getElementById("dynara-content-edit-styles")) {
      var pageStyle = document.createElement("style");
      pageStyle.id = "dynara-content-edit-styles";
      pageStyle.textContent =
        ".dynara-content-hover{outline:2px dashed " + brandColor + " !important;outline-offset:2px !important;cursor:text !important}" +
        ".dynara-content-editing{outline:2px solid " + brandColor + " !important;cursor:text !important}";
      document.head.appendChild(pageStyle);
    }

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

    var tabs = document.createElement("div");
    tabs.className = "dw-tabs";
    var tabsTrack = document.createElement("div");
    tabsTrack.className = "dw-tabs-track";
    var customizeTab = document.createElement("button");
    customizeTab.type = "button";
    customizeTab.className = "dw-tab dw-tab-active";
    customizeTab.textContent = "Customize";
    var editTab = document.createElement("button");
    editTab.type = "button";
    editTab.className = "dw-tab";
    editTab.textContent = "Edit";
    tabsTrack.appendChild(customizeTab);
    tabsTrack.appendChild(editTab);
    tabs.appendChild(tabsTrack);

    var detected = document.createElement("p");
    detected.className = "dw-detected";
    detected.textContent = "Detected via Dynara SDK";

    var body = document.createElement("div");
    body.className = "dw-body dw-panel dw-panel-active";
    body.style.display = "block";

    var editPanel = document.createElement("div");
    editPanel.className = "dw-body dw-panel";

    function setActiveTab(tab) {
      var customizeActive = tab === "customize";
      customizeTab.classList.toggle("dw-tab-active", customizeActive);
      editTab.classList.toggle("dw-tab-active", !customizeActive);
      body.style.display = customizeActive ? "block" : "none";
      editPanel.style.display = customizeActive ? "none" : "flex";
    }

    customizeTab.addEventListener("click", function () { setActiveTab("customize"); });
    editTab.addEventListener("click", function () { setActiveTab("edit"); });

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

    // ── Edit panel ─────────────────────────────────────────────────────
    var editModeOn = false;
    var hoveredContentEl = null;
    var editingContentEl = null;

    function onContentHoverMove(event) {
      if (!editModeOn) return;
      var target = resolveContentTarget(event.target);
      if (target === hoveredContentEl) return;
      if (hoveredContentEl) hoveredContentEl.classList.remove("dynara-content-hover");
      hoveredContentEl = target;
      if (hoveredContentEl) hoveredContentEl.classList.add("dynara-content-hover");
    }

    function finishInlineTextEdit() {
      var el = editingContentEl;
      if (!el) return;
      el.removeAttribute("contenteditable");
      el.classList.remove("dynara-content-editing");
      editingContentEl = null;

      var selector = getSelectorForElement(el);
      var value = (el.textContent || "").trim();
      upsertStoredContentBlock(m, { id: selector, key: value.slice(0, 40) || selector, type: "text", selector: selector, value: value, updatedAt: new Date().toISOString() });
      paintEditPanel();
    }

    function startInlineTextEdit(el) {
      if (editingContentEl === el) return;
      finishInlineTextEdit();
      editingContentEl = el;
      el.classList.add("dynara-content-editing");
      el.setAttribute("contenteditable", "true");
      el.focus();
      el.addEventListener("blur", finishInlineTextEdit, { once: true });
    }

    function promptImageReplace(img) {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        document.body.removeChild(input);
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var dataUrl = reader.result;
          img.src = dataUrl;
          var selector = getSelectorForElement(img);
          upsertStoredContentBlock(m, { id: selector, key: img.alt || selector, type: "image", selector: selector, value: dataUrl, label: img.alt || "Image", updatedAt: new Date().toISOString() });
          paintEditPanel();
        };
        reader.readAsDataURL(file);
      });
      input.click();
    }

    function onContentClick(event) {
      if (!editModeOn) return;
      var target = resolveContentTarget(event.target);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (target.tagName === "IMG") promptImageReplace(target);
      else startInlineTextEdit(target);
    }

    function setEditMode(on) {
      editModeOn = on;
      if (on) {
        document.addEventListener("mousemove", onContentHoverMove, true);
        document.addEventListener("click", onContentClick, true);
      } else {
        document.removeEventListener("mousemove", onContentHoverMove, true);
        document.removeEventListener("click", onContentClick, true);
        if (hoveredContentEl) { hoveredContentEl.classList.remove("dynara-content-hover"); hoveredContentEl = null; }
        finishInlineTextEdit();
      }
    }

    function paintEditPanel() {
      editPanel.innerHTML = "";

      var note = document.createElement("p");
      note.className = "dw-edit-note";
      note.textContent = "Click-to-edit text and images directly on this page.";
      editPanel.appendChild(note);

      if (!hasEdit) {
        var setupCard = document.createElement("div");
        setupCard.className = "dw-edit-card";
        setupCard.innerHTML = '<p class="dw-edit-card-title">🔒 Edit mode isn’t set up yet</p>' +
          '<p class="dw-edit-card-body">The site owner needs to set an edit password in the Dynara dashboard first.</p>';
        editPanel.appendChild(setupCard);
        return;
      }

      if (!isEditUnlocked(m)) {
        var lockedCard = document.createElement("div");
        lockedCard.className = "dw-edit-card";
        var lockedTitle = document.createElement("p");
        lockedTitle.className = "dw-edit-card-title";
        lockedTitle.textContent = "🔒 This page is password-protected";
        var lockedBody = document.createElement("p");
        lockedBody.className = "dw-edit-card-body";
        lockedBody.textContent = "Enter the edit password the site owner shared with you.";
        var pwInput = document.createElement("input");
        pwInput.type = "password";
        pwInput.className = "dw-edit-input";
        pwInput.placeholder = "Edit password";
        var unlockBtn = document.createElement("button");
        unlockBtn.type = "button";
        unlockBtn.className = "dw-edit-btn";
        unlockBtn.textContent = "Unlock edit mode";
        var errorMsg = document.createElement("p");
        errorMsg.className = "dw-edit-error";
        errorMsg.style.display = "none";

        function doUnlock() {
          var pw = pwInput.value.trim();
          if (!pw) return;
          unlockBtn.disabled = true;
          unlockBtn.textContent = "Checking…";
          tryUnlock(m, pw).then(function (ok) {
            unlockBtn.disabled = false;
            unlockBtn.textContent = "Unlock edit mode";
            if (!ok) {
              errorMsg.textContent = "Wrong password.";
              errorMsg.style.display = "block";
              return;
            }
            paintEditPanel();
          });
        }

        pwInput.addEventListener("keydown", function (e) { if (e.key === "Enter") doUnlock(); });
        unlockBtn.addEventListener("click", doUnlock);

        lockedCard.appendChild(lockedTitle);
        lockedCard.appendChild(lockedBody);
        lockedCard.appendChild(pwInput);
        lockedCard.appendChild(unlockBtn);
        lockedCard.appendChild(errorMsg);
        editPanel.appendChild(lockedCard);
        return;
      }

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "dw-edit-btn" + (editModeOn ? " dw-edit-btn-active" : "");
      toggleBtn.textContent = editModeOn ? "Edit mode active — click text or images" : "Enable edit mode";
      toggleBtn.addEventListener("click", function () {
        setEditMode(!editModeOn);
        paintEditPanel();
      });
      editPanel.appendChild(toggleBtn);

      var blocks = loadStoredContentBlocks(m);

      var submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.className = "dw-edit-submit";
      submitBtn.textContent = "Submit edits for review";
      submitBtn.disabled = blocks.length === 0;
      var feedback = document.createElement("p");
      feedback.className = "dw-edit-feedback";
      feedback.style.display = "none";
      submitBtn.addEventListener("click", function () {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting…";
        submitContentEditDraft(m, loadStoredContentBlocks(m)).then(function (res) {
          submitBtn.textContent = "Submit edits for review";
          submitBtn.disabled = loadStoredContentBlocks(m).length === 0;
          feedback.style.display = "block";
          feedback.style.color = res.ok ? "#16a34a" : "#dc2626";
          feedback.textContent = res.ok ? "Submitted to dashboard for review." : res.error;
        });
      });
      editPanel.appendChild(submitBtn);
      editPanel.appendChild(feedback);

      if (blocks.length) {
        var listTitle = document.createElement("p");
        listTitle.className = "dw-title";
        listTitle.style.margin = "16px 0 8px";
        listTitle.textContent = "Content blocks (" + blocks.length + ")";
        editPanel.appendChild(listTitle);

        var list = document.createElement("div");
        list.className = "dw-edit-list";
        blocks.forEach(function (block) {
          var row = document.createElement("div");
          row.className = "dw-edit-block";
          var kind = document.createElement("span");
          kind.className = "dw-edit-block-kind";
          kind.style.color = block.type === "image" ? brandColor : "#0f172a";
          kind.textContent = block.type === "image" ? "🖼️ Image" : "📝 Text";
          var value = document.createElement("p");
          value.className = "dw-edit-block-value";
          value.textContent = block.type === "image" ? block.value : (block.value || "(empty)");
          row.appendChild(kind);
          row.appendChild(value);
          list.appendChild(row);
        });
        editPanel.appendChild(list);
      }
    }

    paintEditPanel();

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
    sidebar.appendChild(tabs);
    sidebar.appendChild(detected);
    sidebar.appendChild(body);
    sidebar.appendChild(editPanel);
    root.appendChild(sidebar);
    root.appendChild(bubble);

    if (saved) applySelection(m, saved.kind, saved.id);

    // Apply already-published content blocks + this browser's own local
    // drafts on load, same as the extension does.
    applyContentBlocks({ contentBlocks: (m.contentBlocks || []).concat(loadStoredContentBlocks(m)) });
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
