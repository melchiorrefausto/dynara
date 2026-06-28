chrome.runtime.onInstalled.addListener(() => {
  console.log("Dynara installed");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_TAB_INFO") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url ?? "" });
    });
    return true;
  }
});
