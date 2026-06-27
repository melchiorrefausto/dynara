import type {
  ActivityBlock,
  ConnectedApp,
  ListBlock,
  MetricBlock,
  SuggestionsBlock,
  WorkspaceAction,
  WorkspaceBlock,
  WorkspaceSchema
} from "@/types/workspace";

export const workspacesStorageKey = "dynara-workspaces-v2";
export const activeWorkspaceStorageKey = "dynara-active-workspace-v2";
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

export function initialWorkspaces() {
  return [];
}

export function createBlankWorkspace(name = "Untitled Workspace"): WorkspaceSchema {
  return {
    id: `workspace-${Date.now()}`,
    name,
    mode: "custom",
    description: "A blank workspace. Add blocks by generating from a prompt or importing a schema.",
    source: "generated",
    actions: [
      { id: "scan-file", label: "Scan File", icon: "search" },
      { id: "cleanup", label: "Cleanup", icon: "sparkles" },
      { id: "sync-variables", label: "Sync Variables", icon: "refresh" },
      { id: "export-report", label: "Export Report", icon: "download" }
    ],
    layout: [
      {
        type: "quick_actions",
        title: "Quick Actions",
        actions: [
          { id: "scan-file", label: "Scan File" },
          { id: "cleanup", label: "Cleanup" },
          { id: "sync-variables", label: "Sync Variables" },
          { id: "export-report", label: "Export Report" }
        ]
      },
      { type: "activity_feed", title: "Activity Feed", items: [] }
    ]
  };
}

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

export function addActivity(
  schema: WorkspaceSchema,
  event: string,
  actor = "Dynara"
): WorkspaceSchema {
  const item = {
    id: `activity-${Date.now()}`,
    actor,
    event,
    time: "just now"
  };

  let added = false;
  const layout = schema.layout.map((block) => {
    if (block.type !== "activity_feed") {
      return block;
    }

    added = true;
    return {
      ...block,
      items: [item, ...block.items].slice(0, 6)
    } satisfies ActivityBlock;
  });

  if (!added) {
    layout.push({
      type: "activity_feed",
      title: "Activity Feed",
      items: [item]
    });
  }

  return { ...schema, layout };
}

export function applyWorkspaceAction(schema: WorkspaceSchema, action: WorkspaceAction): WorkspaceSchema {
  const layout = schema.layout.map((block): WorkspaceBlock => {
    if (action.id === "cleanup" && block.type === "issue_list") {
      return {
        ...block,
        items: block.items.slice(1)
      } satisfies ListBlock;
    }

    if (action.id === "cleanup" && block.type === "metric_card" && /broken|issues/i.test(block.title)) {
      const numeric = Number(block.value);
      return {
        ...block,
        value: Number.isFinite(numeric) ? String(Math.max(numeric - 1, 0)) : block.value,
        trend: "Updated just now"
      } satisfies MetricBlock;
    }

    if (action.id === "sync-variables" && block.type === "metric_card" && /token|variables/i.test(block.title)) {
      return {
        ...block,
        trend: "Synced just now"
      } satisfies MetricBlock;
    }

    return block;
  });

  return addActivity(
    { ...schema, layout },
    `${action.label} completed for ${schema.name}`,
    action.id === "sync-variables" ? "Figma" : "AI"
  );
}

export function applySuggestion(schema: WorkspaceSchema, suggestionId: string, title: string): WorkspaceSchema {
  const layout = schema.layout.map((block): WorkspaceBlock => {
    if (block.type !== "suggestions") {
      return block;
    }

    return {
      ...block,
      items: block.items.filter((item) => item.id !== suggestionId)
    } satisfies SuggestionsBlock;
  });

  return addActivity({ ...schema, layout }, `Applied suggestion: ${title}`, "AI");
}

export function exportWorkspaceFile(schema: WorkspaceSchema) {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
