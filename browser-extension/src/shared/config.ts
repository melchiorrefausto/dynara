// The Dynara backend is where "Ask Dynara" sends prompts. It defaults to the
// local dev server; installs pointed at a deployed instance can override it
// from the side panel without a rebuild.
const STORAGE_KEY = "dynaraBackendUrl";
const DEFAULT_BACKEND_URL = "http://localhost:3001";

export function getBackendUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      resolve(items[STORAGE_KEY] || DEFAULT_BACKEND_URL);
    });
  });
}

export function setBackendUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: url }, () => resolve());
  });
}

export { DEFAULT_BACKEND_URL };
