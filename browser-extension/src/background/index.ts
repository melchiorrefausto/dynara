chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Also set on service-worker restart
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Relays a message to a tab's content script, injecting the content script
// first if it isn't alive yet (e.g. extension was just installed/reloaded).
function sendToTab(tabId: number, message: unknown, fallback: unknown, cb: (res: unknown) => void) {
  const doSend = () => {
    console.info("[Dynara background] sending to tab", { tabId, message });
    chrome.tabs.sendMessage(tabId, message, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("[Dynara background] send failed", chrome.runtime.lastError.message, { tabId, message });
        cb(fallback);
        return;
      }
      console.info("[Dynara background] response from tab", { tabId, message, res });
      cb(res ?? fallback);
    });
  };

  chrome.tabs.sendMessage(tabId, { type: "PING" }, () => {
    if (chrome.runtime.lastError) {
      console.info("[Dynara background] injecting content script", { tabId, reason: chrome.runtime.lastError.message });
      chrome.scripting.executeScript({ target: { tabId }, files: ["dist/content.js"] }, () => {
        if (chrome.runtime.lastError) {
          console.warn("[Dynara background] injection failed", chrome.runtime.lastError.message, { tabId });
          cb(fallback);
          return;
        }
        setTimeout(doSend, 250);
      });
    } else {
      doSend();
    }
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Side panel → content script: toggle a panel
  if (msg.type === "TOGGLE_PANEL_IN_TAB") {
    const { tabId, panelId, selector } = msg as { tabId: number; panelId: string; selector: string };
    sendToTab(tabId, { type: "TOGGLE_PANEL", panelId, selector }, { hidden: [] }, sendResponse);
    return true;
  }

  // Side panel → content script: get hidden panel ids
  if (msg.type === "GET_TAB_STATE") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "GET_STATE" }, { hidden: [] }, sendResponse);
    return true;
  }

  // Side panel → content script: discover the page's Dynara manifest
  if (msg.type === "GET_MANIFEST_IN_TAB") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "GET_MANIFEST" }, { manifest: null }, sendResponse);
    return true;
  }

  // Side panel → content script: apply a named view (show only its panels)
  if (msg.type === "APPLY_VIEW_IN_TAB") {
    const { tabId, panels, visiblePanelIds, viewId } = msg as { tabId: number; panels: { id: string; selector: string }[]; visiblePanelIds: string[]; viewId?: string };
    sendToTab(tabId, { type: "APPLY_VIEW", panels, visiblePanelIds, viewId }, { hidden: [] }, sendResponse);
    return true;
  }

  if (msg.type === "APPLY_PROFILE_IN_TAB") {
    const { tabId, panels, visiblePanelIds, profile } = msg as { tabId: number; panels: { id: string; selector: string }[]; visiblePanelIds: string[]; profile?: unknown };
    sendToTab(tabId, { type: "APPLY_PROFILE", panels, visiblePanelIds, profile }, { hidden: [] }, sendResponse);
    return true;
  }

  // Side panel → content script: trigger a developer-declared action
  if (msg.type === "TRIGGER_ACTION_IN_TAB") {
    const { tabId, actionId } = msg as { tabId: number; actionId: string };
    console.info("[Dynara background] trigger action request", { tabId, actionId });
    sendToTab(tabId, { type: "TRIGGER_ACTION", actionId }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "GET_PERSISTENCE_IN_TAB") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "GET_PERSISTENCE" }, { state: null }, sendResponse);
    return true;
  }

  if (msg.type === "SAVE_CURRENT_STATE_IN_TAB") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "SAVE_CURRENT_STATE" }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "SET_AUTO_APPLY_IN_TAB") {
    const { tabId, autoApply } = msg as { tabId: number; autoApply: boolean };
    sendToTab(tabId, { type: "SET_AUTO_APPLY", autoApply }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "CLEAR_SAVED_STATE_IN_TAB") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "CLEAR_SAVED_STATE" }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "APPLY_INTERFACE_PLAN_IN_TAB") {
    const { tabId, plan } = msg as { tabId: number; plan: unknown };
    sendToTab(tabId, { type: "APPLY_INTERFACE_PLAN", plan }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "SET_INSPECT_MODE_IN_TAB") {
    const { tabId, enabled } = msg as { tabId: number; enabled: boolean };
    sendToTab(tabId, { type: "SET_INSPECT_MODE", enabled }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "GET_WYSIWYG_STATE_IN_TAB") {
    const { tabId } = msg as { tabId: number };
    sendToTab(tabId, { type: "GET_WYSIWYG_STATE" }, { inspectMode: false, selectedSurface: null, surfaceStyles: {} }, sendResponse);
    return true;
  }

  if (msg.type === "APPLY_SURFACE_STYLE_IN_TAB") {
    const { tabId, panelId, style } = msg as { tabId: number; panelId: string; style: unknown };
    sendToTab(tabId, { type: "APPLY_SURFACE_STYLE", panelId, style }, { ok: false }, sendResponse);
    return true;
  }

  if (msg.type === "RESET_SURFACE_STYLE_IN_TAB") {
    const { tabId, panelId } = msg as { tabId: number; panelId: string };
    sendToTab(tabId, { type: "RESET_SURFACE_STYLE", panelId }, { ok: false }, sendResponse);
    return true;
  }
});
