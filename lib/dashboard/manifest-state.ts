import type {
  ContentBlock,
  IntegrationManifest,
  ManifestAction,
  ManifestConstraint,
  ManifestDesignSystem,
  ManifestPanel,
  ManifestSurface,
  ManifestView,
  UserInterfaceProfile
} from "@/types/manifest";

export const manifestsStorageKey = "dynara-manifests-v1";
export const activeManifestStorageKey = "dynara-active-manifest-v1";

export function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-app";
}

const emptyDesignSystem: ManifestDesignSystem = {
  source: "manual",
  version: "1.0.0",
  tokens: [],
  componentRefs: []
};

const defaultConstraints: ManifestConstraint[] = [
  {
    id: "keep-required-surfaces",
    label: "Keep required surfaces visible",
    description: "Surfaces marked as required cannot be hidden by generated profiles.",
    severity: "blocking"
  },
  {
    id: "respect-native-permissions",
    label: "Respect app permissions",
    description: "Dynara actions must only execute capabilities the current user can already perform in the host app.",
    severity: "blocking"
  }
];

export function createBlankManifest(name = "My App"): IntegrationManifest {
  const now = new Date().toISOString();
  const slug = slugify(name);
  return {
    id: `manifest-${Date.now()}`,
    slug,
    name,
    color: "#7c3aed",
    appId: slug,
    panels: [],
    surfaces: [],
    views: [],
    actions: [],
    version: "1.0.0",
    designSystem: emptyDesignSystem,
    constraints: defaultConstraints,
    profiles: [],
    contentBlocks: [],
    createdAt: now,
    updatedAt: now
  };
}

function touch(manifest: IntegrationManifest): IntegrationManifest {
  return { ...manifest, updatedAt: new Date().toISOString() };
}

export function normalizeManifest(manifest: Partial<IntegrationManifest>): IntegrationManifest {
  const base = createBlankManifest(manifest.name ?? "My App");
  const panels = manifest.panels ?? [];
  const surfaces = manifest.surfaces?.length
    ? manifest.surfaces
    : panels.map(panelFromLegacyPanel);

  return {
    ...base,
    ...manifest,
    appId: manifest.appId ?? manifest.slug ?? base.appId,
    version: manifest.version ?? "1.0.0",
    panels,
    surfaces,
    views: manifest.views ?? [],
    actions: manifest.actions ?? [],
    designSystem: {
      ...emptyDesignSystem,
      ...(manifest.designSystem ?? {}),
      tokens: manifest.designSystem?.tokens ?? [],
      componentRefs: manifest.designSystem?.componentRefs ?? []
    },
    constraints: manifest.constraints?.length ? manifest.constraints : defaultConstraints,
    profiles: manifest.profiles ?? [],
    contentBlocks: manifest.contentBlocks ?? [],
    createdAt: manifest.createdAt ?? base.createdAt,
    updatedAt: manifest.updatedAt ?? base.updatedAt
  };
}

function panelFromLegacyPanel(panel: ManifestPanel): ManifestSurface {
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
}

export function addPanel(manifest: IntegrationManifest, panel: ManifestPanel): IntegrationManifest {
  return addSurface(touch({ ...manifest, panels: upsertPanel(manifest.panels, panel) }), panelFromLegacyPanel(panel));
}

export function updatePanel(manifest: IntegrationManifest, panelId: string, patch: Partial<ManifestPanel>): IntegrationManifest {
  return touch({
    ...manifest,
    panels: manifest.panels.map((panel) => (panel.id === panelId ? { ...panel, ...patch } : panel)),
    surfaces: manifest.surfaces.map((surface) =>
      surface.id === panelId
        ? {
            ...surface,
            label: patch.label ?? surface.label,
            selector: patch.selector ?? surface.selector,
            side: patch.side ?? surface.side
          }
        : surface
    )
  });
}

export function removePanel(manifest: IntegrationManifest, panelId: string): IntegrationManifest {
  return touch({
    ...manifest,
    panels: manifest.panels.filter((panel) => panel.id !== panelId),
    surfaces: manifest.surfaces.filter((surface) => surface.id !== panelId),
    views: manifest.views.map((view) => ({ ...view, panels: view.panels.filter((id) => id !== panelId) }))
  });
}

export function addSurface(manifest: IntegrationManifest, surface: ManifestSurface): IntegrationManifest {
  const panels = surface.selector
    ? upsertPanel(manifest.panels, {
        id: surface.id,
        label: surface.label,
        selector: surface.selector,
        side: surface.side
      })
    : manifest.panels;

  return touch({
    ...manifest,
    panels,
    surfaces: upsertSurface(manifest.surfaces, surface)
  });
}

function upsertSurface(surfaces: ManifestSurface[], surface: ManifestSurface) {
  return surfaces.some((item) => item.id === surface.id)
    ? surfaces.map((item) => (item.id === surface.id ? surface : item))
    : [...surfaces, surface];
}

function upsertPanel(panels: ManifestPanel[], panel: ManifestPanel) {
  return panels.some((item) => item.id === panel.id)
    ? panels.map((item) => (item.id === panel.id ? panel : item))
    : [...panels, panel];
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
  return touch({
    ...manifest,
    actions: manifest.actions.some((item) => item.id === action.id)
      ? manifest.actions.map((item) => (item.id === action.id ? action : item))
      : [...manifest.actions, action]
  });
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

export function addProfile(manifest: IntegrationManifest, profile: UserInterfaceProfile): IntegrationManifest {
  return touch({
    ...manifest,
    profiles: manifest.profiles.some((item) => item.id === profile.id)
      ? manifest.profiles.map((item) => (item.id === profile.id ? profile : item))
      : [...manifest.profiles, profile]
  });
}

export function upsertContentBlocks(manifest: IntegrationManifest, blocks: ContentBlock[]): IntegrationManifest {
  const byId = new Map(manifest.contentBlocks.map((block) => [block.id, block]));
  for (const block of blocks) {
    byId.set(block.id, block);
  }
  return touch({ ...manifest, contentBlocks: [...byId.values()] });
}

export function setEditKeyHash(manifest: IntegrationManifest, hash: string | undefined): IntegrationManifest {
  return touch({ ...manifest, editKeyHash: hash });
}

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateDynaraJson(manifest: IntegrationManifest): string {
  return JSON.stringify(
    {
      appId: manifest.appId,
      name: manifest.name,
      version: manifest.version,
      color: manifest.color,
      panels: manifest.panels,
      surfaces: manifest.surfaces,
      views: manifest.views,
      actions: manifest.actions,
      designSystem: manifest.designSystem,
      constraints: manifest.constraints,
      profiles: manifest.profiles,
      contentBlocks: manifest.contentBlocks,
      editKeyHash: manifest.editKeyHash
    },
    null,
    2
  );
}

export function generateScriptSnippet(manifest: IntegrationManifest): string {
  const init = JSON.stringify(
    {
      appId: manifest.appId,
      name: manifest.name,
      version: manifest.version,
      color: manifest.color,
      panels: manifest.panels,
      surfaces: manifest.surfaces,
      views: manifest.views,
      actions: manifest.actions,
      designSystem: manifest.designSystem,
      constraints: manifest.constraints,
      profiles: manifest.profiles,
      contentBlocks: manifest.contentBlocks,
      editKeyHash: manifest.editKeyHash
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
