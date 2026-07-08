chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Also set on service-worker restart
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Relays a message to a tab's content script, injecting the content script
// first if it isn't alive yet (e.g. extension was just installed/reloaded).
function sendToTab(tabId: number, message: unknown, fallback: unknown, cb: (res: unknown) => void) {
  const doSend = () => {
    chrome.tabs.sendMessage(tabId, message, (res) => {
      cb(chrome.runtime.lastError ? fallback : (res ?? fallback));
    });
  };

  chrome.tabs.sendMessage(tabId, { type: "PING" }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({ target: { tabId }, files: ["dist/content.js"] }, () => {
        if (chrome.runtime.lastError) { cb(fallback); return; }
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
    const { tabId, panels, visiblePanelIds } = msg as { tabId: number; panels: { id: string; selector: string }[]; visiblePanelIds: string[] };
    sendToTab(tabId, { type: "APPLY_VIEW", panels, visiblePanelIds }, { hidden: [] }, sendResponse);
    return true;
  }

  // Side panel → content script: trigger a developer-declared action
  if (msg.type === "TRIGGER_ACTION_IN_TAB") {
    const { tabId, actionId } = msg as { tabId: number; actionId: string };
    sendToTab(tabId, { type: "TRIGGER_ACTION", actionId }, { ok: false }, sendResponse);
    return true;
  }
});
