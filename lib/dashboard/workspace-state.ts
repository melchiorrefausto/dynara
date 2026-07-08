import type { ConnectedApp } from "@/types/workspace";

export const appsStorageKey = "dynara-connected-apps-v2";
export const preferencesStorageKey = "dynara-preferences-v2";

export type WorkspacePreferences = {
  autoSaveGenerated: boolean;
  showSuggestions: boolean;
  theme: "light" | "dark";
};

export const defaultPreferences: WorkspacePreferences = {
  autoSaveGenerated: true,
  showSuggestions: true,
  theme: "light"
};

export const defaultConnectedApps: ConnectedApp[] = [
  { id: "figma", name: "Figma", status: "available" },
  { id: "notion", name: "Notion", status: "available" },
  { id: "linear", name: "Linear", status: "available" },
  { id: "gmail", name: "Gmail", status: "available" },
  { id: "slack", name: "Slack", status: "available" }
];

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
