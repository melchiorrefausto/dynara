import type { IntegrationManifest, ManifestAction, ManifestPanel, ManifestView } from "@/types/manifest";

export const manifestsStorageKey = "dynara-manifests-v1";
export const activeManifestStorageKey = "dynara-active-manifest-v1";

export function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-app";
}

export function createBlankManifest(name = "My App"): IntegrationManifest {
  const now = new Date().toISOString();
  return {
    id: `manifest-${Date.now()}`,
    slug: slugify(name),
    name,
    color: "#7c3aed",
    panels: [],
    views: [],
    actions: [],
    createdAt: now,
    updatedAt: now
  };
}

function touch(manifest: IntegrationManifest): IntegrationManifest {
  return { ...manifest, updatedAt: new Date().toISOString() };
}

export function addPanel(manifest: IntegrationManifest, panel: ManifestPanel): IntegrationManifest {
  return touch({ ...manifest, panels: [...manifest.panels, panel] });
}

export function updatePanel(manifest: IntegrationManifest, panelId: string, patch: Partial<ManifestPanel>): IntegrationManifest {
  return touch({
    ...manifest,
    panels: manifest.panels.map((panel) => (panel.id === panelId ? { ...panel, ...patch } : panel))
  });
}

export function removePanel(manifest: IntegrationManifest, panelId: string): IntegrationManifest {
  return touch({
    ...manifest,
    panels: manifest.panels.filter((panel) => panel.id !== panelId),
    views: manifest.views.map((view) => ({ ...view, panels: view.panels.filter((id) => id !== panelId) }))
  });
}

export function addView(manifest: IntegrationManifest, view: ManifestView): IntegrationManifest {
  return touch({ ...manifest, views: [...manifest.views, view] });
}

export function updateView(manifest: IntegrationManifest, viewId: string, patch: Partial<ManifestView>): IntegrationManifest {
  return touch({
    ...manifest,
    views: manifest.views.map((view) => (view.id === viewId ? { ...view, ...patch } : view))
  });
}

export function removeView(manifest: IntegrationManifest, viewId: string): IntegrationManifest {
  return touch({ ...manifest, views: manifest.views.filter((view) => view.id !== viewId) });
}

export function addAction(manifest: IntegrationManifest, action: ManifestAction): IntegrationManifest {
  return touch({ ...manifest, actions: [...manifest.actions, action] });
}

export function updateAction(manifest: IntegrationManifest, actionId: string, patch: Partial<ManifestAction>): IntegrationManifest {
  return touch({
    ...manifest,
    actions: manifest.actions.map((action) => (action.id === actionId ? { ...action, ...patch } : action))
  });
}

export function removeAction(manifest: IntegrationManifest, actionId: string): IntegrationManifest {
  return touch({ ...manifest, actions: manifest.actions.filter((action) => action.id !== actionId) });
}

export function generateDynaraJson(manifest: IntegrationManifest): string {
  return JSON.stringify(
    {
      name: manifest.name,
      color: manifest.color,
      panels: manifest.panels,
      views: manifest.views,
      actions: manifest.actions
    },
    null,
    2
  );
}

export function generateScriptSnippet(manifest: IntegrationManifest): string {
  const init = JSON.stringify(
    {
      name: manifest.name,
      color: manifest.color,
      panels: manifest.panels,
      views: manifest.views,
      actions: manifest.actions
    },
    null,
    2
  );

  const actionWiring = manifest.actions
    .map((action) => `Dynara.action(${JSON.stringify(action.id)}, () => {\n  // TODO: run your real "${action.label}" logic here\n});`)
    .join("\n");

  return [
    `<script src="https://dynara.io/sdk/v1.js"></script>`,
    `<script>`,
    `  Dynara.init(${init.replace(/\n/g, "\n  ")});`,
    actionWiring ? `  ${actionWiring.replace(/\n/g, "\n  ")}` : null,
    `</script>`
  ]
    .filter(Boolean)
    .join("\n");
}
