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
    return {
      name: (raw && raw.name) || document.title || location.hostname,
      color: (raw && raw.color) || "#7c3aed",
      panels: (raw && raw.panels) || [],
      views: (raw && raw.views) || [],
      actions: (raw && raw.actions) || []
    };
  }

  function fetchWellKnown() {
    return fetch("/.well-known/dynara.json", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function ensureManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetchWellKnown().then(function (json) {
      manifest = normalize(json);
      return manifest;
    });
  }

  window.Dynara = {
    init: function (m) {
      manifest = normalize(m);
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
